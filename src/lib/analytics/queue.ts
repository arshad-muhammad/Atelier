/**
 * Atelier Analytics System — Client-Side In-Memory Event Queue
 *
 * Implements non-blocking batching, periodic flushing, visibility/unload flush,
 * and transient retry with backoff.
 */

import { ANALYTICS_CONFIG } from './constants';
import { UniversalEvent } from './types';

interface QueueItem {
  event: UniversalEvent;
  attempts: number;
}

class ClientEventQueue {
  private queue: QueueItem[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Start periodic flush timer
    this.startTimer();

    // Setup lifecycle hooks for flushing before unload
    try {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushSync();
        }
      });

      window.addEventListener('pagehide', () => {
        this.flushSync();
      });

      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
    } catch (e) {
      // Ignore in non-browser environments
    }
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush();
    }, ANALYTICS_CONFIG.FLUSH_INTERVAL_MS);
  }

  /**
   * Enqueue an event. Automatically flushes if batch size is reached.
   */
  public enqueue(event: UniversalEvent) {
    try {
      // Protect memory bounds
      if (this.queue.length >= ANALYTICS_CONFIG.MAX_QUEUE_SIZE) {
        // Drop oldest 10% events to maintain responsiveness
        this.queue.splice(0, Math.floor(ANALYTICS_CONFIG.MAX_QUEUE_SIZE * 0.1));
      }

      this.queue.push({
        event,
        attempts: 0
      });

      if (this.queue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
        // Schedule immediate flush on next microtask / idle frame
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => this.flush());
        } else {
          setTimeout(() => this.flush(), 0);
        }
      }
    } catch (err) {
      // Queueing must NEVER crash or block the UI
      console.warn('[Analytics Queue] Enqueue error:', err);
    }
  }

  /**
   * Asynchronously flush batch of events to backend endpoint
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    const batch = this.queue.splice(0, ANALYTICS_CONFIG.BATCH_SIZE);
    const eventsToSend = batch.map(b => b.event);

    try {
      const response = await fetch(ANALYTICS_CONFIG.CLIENT_INGEST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: true
      });

      if (!response.ok && response.status >= 500) {
        // Server or upstream failure, re-queue eligible events
        this.handleFailure(batch);
      }
    } catch (err) {
      // Network disconnect or transient fetch error
      this.handleFailure(batch);
    } finally {
      this.isFlushing = false;
      // If remaining events still exceed batch threshold, flush next batch
      if (this.queue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
        setTimeout(() => this.flush(), 50);
      }
    }
  }

  /**
   * Synchronous / beacon flush for window unload
   */
  public flushSync(): void {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, ANALYTICS_CONFIG.BATCH_SIZE * 2);
    const eventsToSend = batch.map(b => b.event);

    try {
      const payload = JSON.stringify({ events: eventsToSend });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(ANALYTICS_CONFIG.CLIENT_INGEST_ENDPOINT, blob);
      } else {
        // Fallback fetch with keepalive
        fetch(ANALYTICS_CONFIG.CLIENT_INGEST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Never block unload
    }
  }

  private handleFailure(batch: QueueItem[]) {
    for (const item of batch) {
      if (item.attempts < ANALYTICS_CONFIG.MAX_RETRIES) {
        item.attempts += 1;
        this.queue.push(item);
      }
    }
  }

  /**
   * For testing & diagnostics: inspect current queue size
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * For testing: clear queue
   */
  public clearQueue(): void {
    this.queue = [];
  }
}

// Singleton client queue instance
export const clientQueue = new ClientEventQueue();
