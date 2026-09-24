/**
 * Atelier Analytics System — Universal Types & Schemas
 */

export type UserRole = 'student' | 'mentor' | 'admin' | 'anonymous';

export interface UniversalEvent {
  event_id: string;
  event_name: string;
  timestamp: string; // ISO 8601 string
  user_id: number | null;
  role: UserRole | string | null;
  session_id: string | null;
  course_id: number | null;
  module_id: number | null;
  topic_id: number | null;
  assessment_id: number | null;
  live_session_id: number | null;
  source: string | null;
  metadata: Record<string, any>;
}

export interface TrackPayload {
  userId?: number | null;
  role?: UserRole | string | null;
  sessionId?: string | null;
  courseId?: number | null;
  moduleId?: number | null;
  topicId?: number | null;
  assessmentId?: number | null;
  liveSessionId?: number | null;
  source?: string | null;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  admin_id: number | null;
  admin_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  status: 'SUCCESS' | 'FAILED' | string;
  metadata: Record<string, any>;
}

export interface TrackAuditPayload {
  adminId?: number | null;
  adminEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  oldValue?: string | Record<string, any> | null;
  newValue?: string | Record<string, any> | null;
  status?: 'SUCCESS' | 'FAILED' | string;
  metadata?: Record<string, any>;
}

export type DateFilterRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsFilterOptions {
  range: DateFilterRange;
  startDate?: string;
  endDate?: string;
  role?: string;
  courseId?: number | string;
  search?: string;
}

export interface AnalyticsOverviewMetrics {
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  activeSessions: number;
  courseEnrollments: number;
  courseCompletions: number;
  assessmentAttempts: number;
  avgAssessmentScore: number;
  paymentSuccessCount: number;
  totalRevenue: number;
  retentionRate?: number;
}
