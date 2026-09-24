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

  // Detect Device Type
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const deviceType = isTablet ? 'Tablet' : (isMobile ? 'Mobile' : 'Desktop');

  // Detect Browser
  let browser = 'Other';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opr\//i.test(ua)) browser = 'Opera';

  // Detect Operating System
  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  // Detect Referrer & Domain Source
  let rawReferrer = typeof document !== 'undefined' ? document.referrer : '';
  let referrerDomain = 'Direct';
  if (rawReferrer) {
    try {
      const url = new URL(rawReferrer);
      const host = url.hostname.replace('www.', '').toLowerCase();
      if (host.includes(window.location.hostname)) {
        referrerDomain = 'Internal Navigation';
      } else if (host.includes('google')) referrerDomain = 'Google';
      else if (host.includes('linkedin')) referrerDomain = 'LinkedIn';
      else if (host.includes('github')) referrerDomain = 'GitHub';
      else if (host.includes('twitter') || host.includes('x.com')) referrerDomain = 'Twitter/X';
      else if (host.includes('youtube')) referrerDomain = 'YouTube';
      else if (host.includes('facebook') || host.includes('instagram')) referrerDomain = 'Meta';
      else if (host.includes('whatsapp')) referrerDomain = 'WhatsApp';
      else referrerDomain = host;
    } catch (e) {
      referrerDomain = 'Referral';
    }
  }

  // Detect UTM Campaign Parameters
  let utmSource = '';
  let utmMedium = '';
  let utmCampaign = '';
  try {
    const params = new URLSearchParams(window.location.search);
    utmSource = params.get('utm_source') || '';
    utmMedium = params.get('utm_medium') || '';
    utmCampaign = params.get('utm_campaign') || '';
  } catch (e) {}

  // Timezone & Language
  let timezone = '';
  let language = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    language = navigator.language || '';
  } catch (e) {}

  let screenResolution = '';
  try {
    screenResolution = `${window.screen.width}x${window.screen.height}`;
  } catch (e) {}

  track('page_viewed', {
    source: path,
    metadata: {
      path,
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: rawReferrer,
      referrerDomain: utmSource || referrerDomain,
      utmSource,
      utmMedium,
      utmCampaign,
      deviceType,
      browser,
      os,
      timezone,
      language,
      screenResolution,
      ...metadata
    }
  });

  // If viewing a course page like /courses/1 or /courses/2, track course_viewed with courseId
  if (path.startsWith('/courses/')) {
    const parts = path.split('/');
    const courseId = Number(parts[2]);
    if (courseId && !isNaN(courseId)) {
      track('course_viewed', {
        courseId,
        source: path,
        metadata: { path, title: typeof document !== 'undefined' ? document.title : '' }
      });
    }
  }
}
