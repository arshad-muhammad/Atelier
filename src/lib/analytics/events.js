/**
 * Atelier Analytics System — Central Event Registry & Privacy Sanitizer
 */

import { SENSITIVE_KEY_PATTERNS } from './constants.js';

export const EVENT_REGISTRY = {
  // ── Authentication ──
  AUTH_USER_SIGNED_UP: 'user_signed_up',
  AUTH_USER_LOGIN: 'user_login',
  AUTH_USER_LOGOUT: 'user_logout',
  AUTH_LOGIN_FAILED: 'login_failed',
  AUTH_PASSWORD_CHANGED: 'password_changed',
  AUTH_PASSWORD_RESET: 'password_reset',
  AUTH_SESSION_STARTED: 'session_started',
  AUTH_SESSION_EXPIRED: 'session_expired',

  // ── Navigation / Product ──
  NAV_PAGE_VIEWED: 'page_viewed',
  NAV_FEATURE_OPENED: 'feature_opened',
  NAV_SEARCH_PERFORMED: 'search_performed',
  NAV_BUTTON_CLICKED: 'button_clicked',

  // ── Learning ──
  LEARN_COURSE_VIEWED: 'course_viewed',
  LEARN_COURSE_ENROLLED: 'course_enrolled',
  LEARN_COURSE_STARTED: 'course_started',
  LEARN_MODULE_OPENED: 'module_opened',
  LEARN_TOPIC_OPENED: 'topic_opened',
  LEARN_TOPIC_COMPLETED: 'topic_completed',
  LEARN_COURSE_PROGRESS_UPDATED: 'course_progress_updated',
  LEARN_COURSE_COMPLETED: 'course_completed',
  LEARN_MATERIAL_OPENED: 'material_opened',
  LEARN_MATERIAL_DOWNLOADED: 'material_downloaded',
  LEARN_VIDEO_STARTED: 'video_started',
  LEARN_VIDEO_PROGRESS: 'video_progress',
  LEARN_VIDEO_COMPLETED: 'video_completed',

  // ── Assessments ──
  ASST_VIEWED: 'assessment_viewed',
  ASST_STARTED: 'assessment_started',
  ASST_QUESTION_VIEWED: 'question_viewed',
  ASST_QUESTION_ANSWERED: 'question_answered',
  ASST_QUESTION_SKIPPED: 'question_skipped',
  ASST_QUESTION_FLAGGED: 'question_flagged',
  ASST_ANSWER_CHANGED: 'answer_changed',
  ASST_PAUSED: 'assessment_paused',
  ASST_RESUMED: 'assessment_resumed',
  ASST_SUBMITTED: 'assessment_submitted',
  ASST_AUTO_SUBMITTED: 'assessment_auto_submitted',
  ASST_PASSED: 'assessment_passed',
  ASST_FAILED: 'assessment_failed',

  // ── Proctoring ──
  PROCTOR_TAB_SWITCH: 'proctor_tab_switch',
  PROCTOR_WINDOW_BLUR: 'proctor_window_blur',
  PROCTOR_FULLSCREEN_EXIT: 'proctor_fullscreen_exit',

  // ── Live Classroom ──
  LIVE_SESSION_VIEWED: 'live_session_viewed',
  LIVE_SESSION_JOINED: 'live_session_joined',
  LIVE_SESSION_LEFT: 'live_session_left',
  LIVE_SESSION_RECONNECTED: 'live_session_reconnected',
  LIVE_SCREEN_SHARE_STARTED: 'screen_share_started',
  LIVE_SCREEN_SHARE_STOPPED: 'screen_share_stopped',
  LIVE_CHAT_MESSAGE_SENT: 'chat_message_sent',
  LIVE_RECORDING_OPENED: 'recording_opened',
  LIVE_RECORDING_COMPLETED: 'recording_completed',
  LIVE_MENTOR_MUTE_ALL: 'mentor_mute_all',
  LIVE_MENTOR_KICK_STUDENT: 'mentor_kick_student',

  // ── Mentor ──
  MENTOR_LOGIN: 'mentor_login',
  MENTOR_COURSE_OPENED: 'course_opened',
  MENTOR_STUDENT_PROFILE_VIEWED: 'student_profile_viewed',
  MENTOR_STUDENT_PROGRESS_VIEWED: 'student_progress_viewed',
  MENTOR_SYLLABUS_CREATED: 'syllabus_created',
  MENTOR_MODULE_CREATED: 'module_created',
  MENTOR_TOPIC_CREATED: 'topic_created',
  MENTOR_TOPIC_UPDATED: 'topic_updated',
  MENTOR_TOPIC_DELETED: 'topic_deleted',
  MENTOR_LIVE_SESSION_CREATED: 'live_session_created',
  MENTOR_LIVE_SESSION_STARTED: 'live_session_started',
  MENTOR_LIVE_SESSION_ENDED: 'live_session_ended',
  MENTOR_MATERIAL_UPLOADED: 'material_uploaded',
  MENTOR_MATERIAL_DELETED: 'material_deleted',
  MENTOR_SUBMISSION_OPENED: 'submission_opened',
  MENTOR_SUBMISSION_GRADED: 'submission_graded',
  MENTOR_FEEDBACK_GIVEN: 'feedback_given',

  // ── Admin ──
  ADMIN_LOGIN: 'admin_login',
  ADMIN_STUDENT_CREATED: 'student_created',
  ADMIN_STUDENT_UPDATED: 'student_updated',
  ADMIN_STUDENT_DELETED: 'student_deleted',
  ADMIN_MENTOR_CREATED: 'mentor_created',
  ADMIN_MENTOR_UPDATED: 'mentor_updated',
  ADMIN_MENTOR_DELETED: 'mentor_deleted',
  ADMIN_COURSE_CREATED: 'course_created',
  ADMIN_COURSE_UPDATED: 'course_updated',
  ADMIN_COURSE_DELETED: 'course_deleted',
  ADMIN_MENTOR_ASSIGNED: 'mentor_assigned',
  ADMIN_ASSESSMENT_CREATED: 'assessment_created',
  ADMIN_ASSESSMENT_UPDATED: 'assessment_updated',
  ADMIN_ASSESSMENT_DELETED: 'assessment_deleted',

  // ── Payments ──
  PAY_PRICING_VIEWED: 'pricing_viewed',
  PAY_CHECKOUT_STARTED: 'checkout_started',
  PAY_PAYMENT_INITIATED: 'payment_initiated',
  PAY_PAYMENT_SUCCESS: 'payment_success',
  PAY_PAYMENT_FAILED: 'payment_failed',
  PAY_PAYMENT_CANCELLED: 'payment_cancelled',
  PAY_REFUND_REQUESTED: 'refund_requested',
  PAY_REFUND_COMPLETED: 'refund_completed',

  // ── Technical ──
  TECH_API_ERROR: 'api_error',
  TECH_SERVER_ERROR: 'server_error',
  TECH_DATABASE_ERROR: 'database_error',
  TECH_AUTH_ERROR: 'authentication_error',
  TECH_PAYMENT_ERROR: 'payment_error',
  TECH_TELEGRAM_ERROR: 'telegram_error',
  TECH_JITSI_ERROR: 'jitsi_error',
  TECH_ASSESSMENT_ERROR: 'assessment_error',
  TECH_SLOW_REQUEST: 'slow_request',
};

/**
 * Strips sensitive keys (passwords, tokens, authorization secrets) from metadata
 */
export function sanitizeMetadata(data) {
  if (!data || typeof data !== 'object') return {};

  const clean = {};

  try {
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitive) {
        continue;
      }

      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeMetadata(value);
      } else if (Array.isArray(value)) {
        clean[key] = value.map(item => (typeof item === 'object' ? sanitizeMetadata(item) : item));
      } else {
        clean[key] = value;
      }
    }
  } catch (err) {
    return { sanitized_error: 'Unable to parse metadata' };
  }

  return clean;
}

/**
 * Normalizes any payload into the standard UniversalEvent schema
 */
export function buildUniversalEvent(eventName, payload = {}) {
  const {
    userId,
    user_id,
    role,
    sessionId,
    session_id,
    courseId,
    course_id,
    moduleId,
    module_id,
    topicId,
    topic_id,
    assessmentId,
    assessment_id,
    liveSessionId,
    live_session_id,
    source,
    metadata = {},
    ...extraFields
  } = payload;

  const rawMetadata = {
    ...extraFields,
    ...(typeof metadata === 'object' ? metadata : {})
  };

  const cleanMetadata = sanitizeMetadata(rawMetadata);

  return {
    event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    event_name: eventName,
    timestamp: new Date().toISOString(),
    user_id: user_id ?? userId ?? null,
    role: role || null,
    session_id: session_id ?? sessionId ?? null,
    course_id: course_id ?? courseId ?? null,
    module_id: module_id ?? moduleId ?? null,
    topic_id: topic_id ?? topicId ?? null,
    assessment_id: assessment_id ?? assessmentId ?? null,
    live_session_id: live_session_id ?? liveSessionId ?? null,
    source: source || 'client',
    metadata: cleanMetadata
  };
}
