/**
 * Atelier Analytics System — Constants & Configuration
 */

export const ANALYTICS_CONFIG = {
  BATCH_SIZE: 25,
  FLUSH_INTERVAL_MS: 5000,
  MAX_QUEUE_SIZE: 1000,
  MAX_RETRIES: 3,
  SLOW_REQUEST_THRESHOLD_MS: 1000,
  CLIENT_INGEST_ENDPOINT: '/api/analytics/events',
  DEFAULT_DATA_SOURCE: 'atelier_events',
  DEFAULT_AUDIT_DATA_SOURCE: 'atelier_audit_events',
  DASHBOARD_CACHE_TTL_MS: 60 * 1000,
};

export const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /jwt/i,
  /bearer/i,
  /authorization/i,
  /api[_-]?key/i,
  /razorpay[_-]?key[_-]?secret/i,
  /tinybird[_-]?(api[_-]?)?key/i,
  /card[_-]?num/i,
  /cvv/i,
  /otp/i,
  /pin/i,
  /private[_-]?key/i,
  /credential/i
];

export const SAFE_ROLES = ['student', 'mentor', 'admin', 'anonymous'];
