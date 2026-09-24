'use server';

import { 
  getAssessmentsByCourse, 
  getAllAssessmentsAdmin, 
  getAssessmentById, 
  saveAssessment, 
  deleteAssessment,
  saveAssessmentSection,
  deleteAssessmentSection,
  getCourseQuestionBank,
  saveQuestion,
  deleteQuestion,
  linkQuestionToAssessment,
  unlinkQuestionFromAssessment,
  getStudentCourseAssessments,
  startOrResumeAttempt,
  getAttemptPlayerState,
  saveAttemptProgress,
  recordProctoringEvent,
  submitAssessmentAttempt,
  getAttemptFullResult,
  getAssessmentResultsList,
  gradeManualResponse
} from './service.js';
import { executeCode, executeSQL } from './sandbox.js';
import { assertMentorOwnsCourse } from '@/utils/auth';
import { query } from '@/utils/db-sql';
import { trackServer } from '@/lib/analytics/server';

// ─────────────────────────────────────────────────────────────
// MENTOR ACTIONS (Strictly Scoped to Mentor's Assigned Course)
// ─────────────────────────────────────────────────────────────

export async function getMentorCourseAssessments(mentorId, courseId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await getAssessmentsByCourse(courseId);
}

export async function getMentorAssessmentDetails(mentorId, courseId, assessmentId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  const asst = await getAssessmentById(assessmentId, true);
  if (asst && asst.course_id !== Number(courseId)) {
    throw new Error('Unauthorized assessment access.');
  }
  return asst;
}

export async function saveMentorCourseAssessment(mentorId, courseId, assessmentData) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await saveAssessment({
    ...assessmentData,
    course_id: Number(courseId)
  });
}

export async function deleteMentorCourseAssessment(mentorId, courseId, assessmentId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  const asst = await getAssessmentById(assessmentId, false);
  if (asst && asst.course_id !== Number(courseId)) {
    throw new Error('Unauthorized assessment deletion.');
  }
  return await deleteAssessment(assessmentId);
}

export async function getMentorQuestionBank(mentorId, courseId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await getCourseQuestionBank(courseId);
}

export async function saveMentorQuestion(mentorId, courseId, questionData) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await saveQuestion({
    ...questionData,
    course_id: Number(courseId)
  });
}

export async function deleteMentorQuestion(mentorId, courseId, questionId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await deleteQuestion(questionId);
}

export async function linkQuestionToAssessmentMentor(mentorId, courseId, linkData) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await linkQuestionToAssessment(linkData);
}

export async function unlinkQuestionFromAssessmentMentor(mentorId, courseId, assessmentId, questionId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await unlinkQuestionFromAssessment(assessmentId, questionId);
}

export async function saveMentorSection(mentorId, courseId, sectionData) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await saveAssessmentSection(sectionData);
}

export async function deleteMentorSection(mentorId, courseId, sectionId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await deleteAssessmentSection(sectionId);
}

export async function getMentorAssessmentResults(mentorId, courseId, assessmentId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await getAssessmentResultsList(assessmentId);
}

export async function getMentorAttemptFullReview(mentorId, courseId, attemptId) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await getAttemptFullResult(attemptId);
}

export async function gradeManualResponseMentor(mentorId, courseId, { attemptId, questionId, marksAwarded, feedback }) {
  await assertMentorOwnsCourse(mentorId, courseId);
  return await gradeManualResponse({
    attemptId,
    questionId,
    marksAwarded: Number(marksAwarded),
    feedback,
    gradedBy: mentorId
  });
}

// ─────────────────────────────────────────────────────────────
// ADMIN ACTIONS (Universal Access)
// ─────────────────────────────────────────────────────────────

export async function getAllAssessmentsAdminAction() {
  return await getAllAssessmentsAdmin();
}

export async function saveAssessmentAdminAction(assessmentData) {
  if (!assessmentData.course_id) {
    throw new Error('Course assignment is required for assessment creation.');
  }
  return await saveAssessment(assessmentData);
}

export async function deleteAssessmentAdminAction(assessmentId) {
  return await deleteAssessment(assessmentId);
}

export async function getAssessmentDetailsAdmin(assessmentId) {
  return await getAssessmentById(assessmentId, true);
}

export async function getGlobalQuestionBankAdmin(courseId = null) {
  if (courseId) {
    return await getCourseQuestionBank(courseId);
  }
  // Retrieve across all courses
  const questions = await query(`
    SELECT q.*, c.title AS course_title
    FROM atelier_questions q
    JOIN atelier_courses c ON q.course_id = c.id
    ORDER BY q.created_at DESC
  `);
  return questions;
}

export async function saveQuestionAdminAction(questionData) {
  if (!questionData.course_id) {
    throw new Error('Course ID is required to save a question.');
  }
  return await saveQuestion(questionData);
}

export async function deleteQuestionAdminAction(questionId) {
  return await deleteQuestion(questionId);
}

export async function getAssessmentResultsAdmin(assessmentId) {
  return await getAssessmentResultsList(assessmentId);
}

export async function gradeManualResponseAdmin({ attemptId, questionId, marksAwarded, feedback }) {
  return await gradeManualResponse({
    attemptId,
    questionId,
    marksAwarded: Number(marksAwarded),
    feedback,
    gradedBy: 1 // Admin marker
  });
}

// ─────────────────────────────────────────────────────────────
// STUDENT ACTIONS (Enrolled Courses Scoped)
// ─────────────────────────────────────────────────────────────

async function getStudentByEmail(email) {
  if (!email) throw new Error('Unauthorized: Student email required.');
  const cleanEmail = email.trim().toLowerCase();
  const [student] = await query(`SELECT id, name, email FROM atelier_students WHERE LOWER(email) = ? LIMIT 1`, [cleanEmail]);
  if (!student) throw new Error('Student account not found.');
  return student;
}

export async function getStudentAssessmentsAction(studentEmail, courseId = null) {
  const student = await getStudentByEmail(studentEmail);
  return await getStudentCourseAssessments(student.id, courseId);
}

export async function startOrResumeStudentAttemptAction(studentEmail, assessmentId) {
  const student = await getStudentByEmail(studentEmail);
  const result = await startOrResumeAttempt(student.id, assessmentId);
  try {
    trackServer('assessment_started', {
      userId: student.id,
      role: 'student',
      assessmentId: Number(assessmentId)
    });
  } catch (e) {}
  return result;
}

export async function getStudentAttemptPlayerAction(studentEmail, attemptId) {
  const student = await getStudentByEmail(studentEmail);
  return await getAttemptPlayerState(student.id, attemptId);
}

export async function saveStudentAttemptProgressAction(studentEmail, attemptId, responses) {
  const student = await getStudentByEmail(studentEmail);
  return await saveAttemptProgress(student.id, attemptId, responses);
}

export async function recordStudentProctoringAction(studentEmail, attemptId, eventType, metadata = null) {
  const student = await getStudentByEmail(studentEmail);
  const result = await recordProctoringEvent(student.id, attemptId, eventType, metadata);
  try {
    const evtName = eventType === 'tab_switch' ? 'proctor_tab_switch' :
                    eventType === 'blur' ? 'proctor_window_blur' :
                    eventType === 'fullscreen_exit' ? 'proctor_fullscreen_exit' : `proctor_${eventType}`;
    trackServer(evtName, {
      userId: student.id,
      role: 'student',
      metadata: { attemptId, eventType, ...(metadata || {}) }
    });
  } catch (e) {}
  return result;
}

export async function submitStudentAttemptAction(studentEmail, attemptId, finalResponses = null) {
  const student = await getStudentByEmail(studentEmail);
  const result = await submitAssessmentAttempt(student.id, attemptId, finalResponses);
  try {
    trackServer('assessment_submitted', {
      userId: student.id,
      role: 'student',
      metadata: {
        attemptId,
        score: result?.attempt?.total_score,
        percentage: result?.attempt?.percentage,
        passed: Boolean(result?.attempt?.passed)
      }
    });
    if (result?.attempt?.passed) {
      trackServer('assessment_passed', { userId: student.id, role: 'student', metadata: { attemptId } });
    } else {
      trackServer('assessment_failed', { userId: student.id, role: 'student', metadata: { attemptId } });
    }
  } catch (e) {}
  return result;
}


export async function getStudentAttemptResultAction(studentEmail, attemptId) {
  const student = await getStudentByEmail(studentEmail);
  const result = await getAttemptFullResult(attemptId);
  if (!result || result.attempt.student_id !== student.id) {
    throw new Error('Result not found or unauthorized.');
  }
  return result;
}

/**
 * Sandboxed code testing for students inside the code editor.
 * Allows running test cases or code snippets live before submitting.
 */
export async function runStudentCodeTestAction({ language, code, input }) {
  return await executeCode({ language, code, input, timeLimitMs: 3000 });
}

/**
 * Sandboxed SQL testing for students inside SQL editor.
 */
export async function runStudentSQLTestAction({ studentSql, schemaSql }) {
  return await executeSQL({ studentSql, schemaSql });
}
