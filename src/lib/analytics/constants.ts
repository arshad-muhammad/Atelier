/**
 * Atelier Analytics System — Constants & Configuration
 */

export const ANALYTICS_CONFIG = {
  // Batch size: 10–50 events before triggering flush
  BATCH_SIZE: 25,
  // Flush interval: 5 seconds
  FLUSH_INTERVAL_MS: 5000,
  // Max events kept in memory before dropping low-priority events to prevent memory leaks
  MAX_QUEUE_SIZE: 1000,
  // Max retries for transient HTTP errors
  MAX_RETRIES: 3,
  // Threshold to classify an API request as slow
  SLOW_REQUEST_THRESHOLD_MS: 1000,
  // Client batch endpoint
  CLIENT_INGEST_ENDPOINT: '/api/analytics/events',
  // Tinybird default data sources
  DEFAULT_DATA_SOURCE: 'atelier_events',
  DEFAULT_AUDIT_DATA_SOURCE: 'atelier_audit_events',
  // Cache TTL for dashboard queries in milliseconds (60 seconds)
  DASHBOARD_CACHE_TTL_MS: 60 * 1000,
};

// Blacklisted keys that must NEVER be sent to analytics or stored in metadata
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

export const SAFE_ROLES = ['student', 'mentor', 'admin', 'anonymous'] as const;
