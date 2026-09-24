/**
 * Atelier Analytics System — Client Analytics SDK
 *
 * Safe, non-blocking client-side tracking.
 */

import { buildUniversalEvent } from './events';
import { clientQueue } from './queue';
import { TrackPayload, UserRole } from './types';

// In-memory identity state
let identifiedUser: {
  userId: number | null;
  role: UserRole | string | null;
  traits: Record<string, any>;
} = {
  userId: null,
  role: null,
  traits: {}
};

/**
 * Gets or initializes the anonymous session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return `sess_${Date.now()}_srv`;
  }

  try {
    let sessId = sessionStorage.getItem('atelier_analytics_session_id');
    if (!sessId) {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('atelier_analytics_session_id', sessId);

      // Track session start
      track('session_started', {
        sessionId: sessId,
        source: 'browser_init'
      });
    }
    return sessId;
  } catch (e) {
    return `sess_${Date.now()}_fallback`;
  }
}

/**
 * Gets the current logged-in student or mentor ID from local storage safely
 */
function getCachedAuthContext(): { userId: number | null; role: string | null } {
  if (typeof window === 'undefined') return { userId: null, role: null };

  try {
    // Check if student profile exists in localStorage
    const rawStudent = localStorage.getItem('studentProfile');
    if (rawStudent) {
      const student = JSON.parse(rawStudent);
      if (student && student.id) {
        return { userId: Number(student.id), role: 'student' };
      }
    }

    // Check if mentor profile exists
    const rawMentor = localStorage.getItem('mentorProfile') || sessionStorage.getItem('mentorSession');
    if (rawMentor) {
      const mentor = JSON.parse(rawMentor);
      if (mentor && mentor.id) {
        return { userId: Number(mentor.id), role: 'mentor' };
      }
    }

    // Check if admin is logged in
    const adminToken = sessionStorage.getItem('adminSessionToken');
    if (adminToken) {
      return { userId: 1, role: 'admin' };
    }
  } catch (e) {}

  return { userId: identifiedUser.userId, role: identifiedUser.role };
}

/**
 * Identify user with their ID and role
 */
export function identify(userId: number, role: UserRole | string, traits: Record<string, any> = {}) {
  identifiedUser = {
    userId,
    role,
    traits
  };

  track('user_login', {
    userId,
    role,
    metadata: {
      traits
    }
  });
}

/**
 * Reset identity on logout
 */
export function resetIdentity() {
  track('user_logout', {
    userId: identifiedUser.userId,
    role: identifiedUser.role
  });

  identifiedUser = {
    userId: null,
    role: null,
    traits: {}
  };

  try {
    sessionStorage.removeItem('atelier_analytics_session_id');
  } catch (e) {}
}

/**
 * Primary Client-Side Tracking API
 * Usage:
 * track('course_viewed', { courseId: 42 });
 */
export function track(eventName: string, payload: TrackPayload = {}): void {
  try {
    const sessionId = payload.sessionId || getOrCreateSessionId();
    const auth = getCachedAuthContext();

    const fullPayload: TrackPayload = {
      userId: payload.userId ?? auth.userId,
      role: payload.role ?? auth.role ?? 'anonymous',
      sessionId,
      source: payload.source || (typeof window !== 'undefined' ? window.location.pathname : 'web'),
      ...payload
    };

    const event = buildUniversalEvent(eventName, fullPayload);
    clientQueue.enqueue(event);
  } catch (err) {
    // Analytics failures must NEVER break client-side execution
    console.warn('[Analytics Client] Track failed silently:', err);
  }
}

/**
 * Helper to record page views
 */
export function trackPageView(pageName?: string, metadata: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  const path = pageName || window.location.pathname;

  track('page_viewed', {
    source: path,
    metadata: {
      path,
      title: document.title,
      referrer: document.referrer,
      ...metadata
    }
  });
}
