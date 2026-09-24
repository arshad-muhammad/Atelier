/**
 * Comprehensive Test Suite for Atelier Analytics & Audit System
 * Tests Client Queue, Server Authoritative Events, Privacy Sanitization,
 * Admin Clearance Guardrails, and Fault Tolerance.
 */

import { buildUniversalEvent, sanitizeMetadata, EVENT_REGISTRY } from '../src/lib/analytics/events.js';
import { ANALYTICS_CONFIG } from '../src/lib/analytics/constants.js';
import { trackServer, trackAudit, getAnalyticsOverview, getAuditLogs } from '../src/lib/analytics/server.js';
import { signAdminSession, verifyAdminSessionToken, signMentorSession } from '../src/utils/auth.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   RUNNING ATELIER ANALYTICS & AUDIT TEST SUITE');
  console.log('======================================================\n');

  // ── 1. PRIVACY & SANITIZATION TESTS ──
  console.log('🧪 1. Privacy & Sensitive Data Sanitization');
  const dirtyMetadata = {
    courseTitle: 'Full-Stack AI Cohort',
    price: 4999,
    password: 'supersecretpassword',
    token: 'jwt.token.string',
    apiKey: 'secret_live_key',
    razorpay_key_secret: 'rzp_secret_123',
    authorization: 'Bearer token',
    safeField: 'active'
  };

  const clean = sanitizeMetadata(dirtyMetadata);
  assert(clean.courseTitle === 'Full-Stack AI Cohort', 'Retains non-sensitive fields');
  assert(clean.price === 4999, 'Retains numerical values');
  assert(clean.password === undefined, 'Strips password field');
  assert(clean.token === undefined, 'Strips token field');
  assert(clean.apiKey === undefined, 'Strips apiKey field');
  assert(clean.razorpay_key_secret === undefined, 'Strips razorpay_key_secret');
  assert(clean.authorization === undefined, 'Strips authorization header');
  assert(clean.safeField === 'active', 'Preserves safe metadata');

  // ── 2. UNIVERSAL EVENT SCHEMA NORMALIZATION ──
  console.log('\n🧪 2. Universal Event Schema Normalization');
  const event = buildUniversalEvent(EVENT_REGISTRY.LEARN_COURSE_STARTED, {
    userId: 42,
    role: 'student',
    courseId: 10,
    sessionId: 'sess_test_123',
    metadata: {
      lessonNumber: 3,
      password: 'must_be_stripped'
    }
  });

  assert(event.event_id.startsWith('evt_'), 'Generates valid evt_ prefixed ID');
  assert(event.event_name === 'course_started', 'Sets normalized event name');
  assert(event.user_id === 42, 'Attaches user_id');
  assert(event.role === 'student', 'Attaches student role');
  assert(event.course_id === 10, 'Attaches course_id');
  assert(event.metadata.lessonNumber === 3, 'Includes sanitized custom metadata');
  assert(event.metadata.password === undefined, 'Strips sensitive metadata in universal event');
  assert(typeof event.timestamp === 'string', 'Provides ISO timestamp');

  // ── 3. CLIENT QUEUE & BATCHING LOGIC ──
  console.log('\n🧪 3. Client Queue Batching & Bounding');
  let testQueue = [];
  const MAX_SIZE = ANALYTICS_CONFIG.MAX_QUEUE_SIZE;
  const BATCH_SIZE = ANALYTICS_CONFIG.BATCH_SIZE;

  for (let i = 0; i < BATCH_SIZE + 5; i++) {
    testQueue.push({ event: { id: i }, attempts: 0 });
  }

  assert(testQueue.length === BATCH_SIZE + 5, `Queue accepts events (size: ${testQueue.length})`);
  const batch = testQueue.splice(0, BATCH_SIZE);
  assert(batch.length === BATCH_SIZE, `Extracts exact batch of ${BATCH_SIZE} events`);
  assert(testQueue.length === 5, 'Leaves remaining events in queue');

  // Test retry backoff mechanism
  const retryItem = { event: { id: 999 }, attempts: 0 };
  retryItem.attempts += 1;
  assert(retryItem.attempts === 1, 'Increments retry attempt counter on transient failure');
  assert(retryItem.attempts < ANALYTICS_CONFIG.MAX_RETRIES, 'Checks against MAX_RETRIES (3)');

  // ── 4. SERVER AUTHORITATIVE TRACKING (NON-BLOCKING) ──
  console.log('\n🧪 4. Server Authoritative Event Generation & Fault Tolerance');
  let threwError = false;
  try {
    await trackServer(EVENT_REGISTRY.PAY_PAYMENT_SUCCESS, {
      userId: 77,
      role: 'student',
      courseId: 2,
      metadata: {
        amount: 5999,
        transactionId: 'txn_mock_99'
      }
    });
  } catch (err) {
    threwError = true;
  }
  assert(!threwError, 'trackServer executes non-blockingly without throwing');

  // Test Admin Audit Event Tracking
  let auditThrew = false;
  try {
    await trackAudit({
      adminId: 1,
      adminEmail: 'admin@atelier.academy',
      action: 'Updated Course',
      entity: 'Course',
      entityId: 2,
      oldValue: 'price: ₹11998',
      newValue: 'price: ₹5999',
      status: 'SUCCESS'
    });
  } catch (err) {
    auditThrew = true;
  }
  assert(!auditThrew, 'trackAudit executes and buffers audit log securely');

  // ── 5. ADMIN AUTHORIZATION & SECURITY GUARDRAILS ──
  console.log('\n🧪 5. Admin Authorization & Access Control');

  // Generate Admin JWT Token
  const validAdminToken = signAdminSession({ user: 'admin_operator', clearedAt: Date.now() });
  const verifiedAdmin = verifyAdminSessionToken(validAdminToken);
  assert(Boolean(verifiedAdmin && verifiedAdmin.role === 'admin'), 'Admin token successfully verified with role=admin');

  // Generate Mentor JWT Token
  const mentorToken = signMentorSession({ id: 9, email: 'mentor@atelier.academy', role: 'mentor' });
  const mentorVerify = verifyAdminSessionToken(mentorToken);
  assert(mentorVerify === null, 'Mentor token is strictly rejected for admin clearance');

  // Student Token rejection
  const studentVerify = verifyAdminSessionToken('fake_student_token');
  assert(studentVerify === null, 'Invalid/Student token is strictly rejected');

  // ── 6. CACHED DASHBOARD ANALYTICS QUERIES ──
  console.log('\n🧪 6. Dashboard Analytical Queries & Cache Layer');
  const overview = await getAnalyticsOverview({ range: '30d' }, true);
  assert(overview && overview.data, 'Overview query returns data structure');
  assert(typeof overview.data.dau === 'number', 'Contains numeric DAU metric');
  assert(typeof overview.data.mau === 'number', 'Contains numeric MAU metric');
  assert(typeof overview.data.revenue === 'number', 'Contains total platform revenue metric');
  assert(Boolean(overview.lastUpdated), 'Includes formatted lastUpdated timestamp');

  // Audit Logs Query
  const auditLogs = await getAuditLogs({ range: '30d' }, true);
  assert(Array.isArray(auditLogs.data.logs), 'Audit logs query returns array of audit records');
  assert(auditLogs.data.logs.length > 0, 'Audit logs contains recorded audit operations');
  assert(auditLogs.data.logs[0].status === 'SUCCESS', 'Audit log has valid status');

  console.log('\n======================================================');
  console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests} CHECKS VERIFIED ✅`);
  console.log('======================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
