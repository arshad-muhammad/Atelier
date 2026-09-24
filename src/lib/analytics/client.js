/**
 * Atelier Analytics System — Client Analytics SDK (JS Runtime)
 */

import { buildUniversalEvent } from './events.js';
import { clientQueue } from './queue.js';

let identifiedUser = {
  userId: null,
  role: null,
  traits: {}
};

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') {
    return `sess_${Date.now()}_srv`;
  }

  try {
    let sessId = sessionStorage.getItem('atelier_analytics_session_id');
    if (!sessId) {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('atelier_analytics_session_id', sessId);

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

function getCachedAuthContext() {
  if (typeof window === 'undefined') return { userId: null, role: null };

  try {
    const rawStudent = localStorage.getItem('studentProfile');
    if (rawStudent) {
      const student = JSON.parse(rawStudent);
      if (student && student.id) {
        return { userId: Number(student.id), role: 'student' };
      }
    }

    const rawMentor = localStorage.getItem('mentorProfile') || sessionStorage.getItem('mentorSession');
    if (rawMentor) {
      const mentor = JSON.parse(rawMentor);
      if (mentor && mentor.id) {
        return { userId: Number(mentor.id), role: 'mentor' };
      }
    }

    const adminToken = sessionStorage.getItem('adminSessionToken');
    if (adminToken) {
      return { userId: 1, role: 'admin' };
    }
  } catch (e) {}

  return { userId: identifiedUser.userId, role: identifiedUser.role };
}

export function identify(userId, role, traits = {}) {
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

export function track(eventName, payload = {}) {
  try {
    const sessionId = payload.sessionId || getOrCreateSessionId();
    const auth = getCachedAuthContext();

    const fullPayload = {
      userId: payload.userId ?? auth.userId,
      role: payload.role ?? auth.role ?? 'anonymous',
      sessionId,
      source: payload.source || (typeof window !== 'undefined' ? window.location.pathname : 'web'),
      ...payload
    };

    const event = buildUniversalEvent(eventName, fullPayload);
    clientQueue.enqueue(event);
  } catch (err) {
    console.warn('[Analytics Client] Track failed silently:', err);
  }
}

export function trackPageView(pageName, metadata = {}) {
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
