/**
 * Atelier Analytics System — Client-Side In-Memory Event Queue (JS Runtime)
 */

import { ANALYTICS_CONFIG } from './constants.js';

class ClientEventQueue {
  constructor() {
    this.queue = [];
    this.timer = null;
    this.isFlushing = false;
    this.isInitialized = false;

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.startTimer();

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
    } catch (e) {}
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush();
    }, ANALYTICS_CONFIG.FLUSH_INTERVAL_MS);
  }

  enqueue(event) {
    try {
      if (this.queue.length >= ANALYTICS_CONFIG.MAX_QUEUE_SIZE) {
        this.queue.splice(0, Math.floor(ANALYTICS_CONFIG.MAX_QUEUE_SIZE * 0.1));
      }

      this.queue.push({
        event,
        attempts: 0
      });

      if (this.queue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(() => this.flush());
        } else {
          setTimeout(() => this.flush(), 0);
        }
      }
    } catch (err) {
      console.warn('[Analytics Queue] Enqueue error:', err);
    }
  }

  async flush() {
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
        this.handleFailure(batch);
      }
    } catch (err) {
      this.handleFailure(batch);
    } finally {
      this.isFlushing = false;
      if (this.queue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
        setTimeout(() => this.flush(), 50);
      }
    }
  }

  flushSync() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, ANALYTICS_CONFIG.BATCH_SIZE * 2);
    const eventsToSend = batch.map(b => b.event);

    try {
      const payload = JSON.stringify({ events: eventsToSend });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(ANALYTICS_CONFIG.CLIENT_INGEST_ENDPOINT, blob);
      } else {
        fetch(ANALYTICS_CONFIG.CLIENT_INGEST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}
  }

  handleFailure(batch) {
    for (const item of batch) {
      if (item.attempts < ANALYTICS_CONFIG.MAX_RETRIES) {
        item.attempts += 1;
        this.queue.push(item);
      }
    }
  }

  getQueueLength() {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
  }
}

export const clientQueue = new ClientEventQueue();
