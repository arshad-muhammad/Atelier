import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { query, execute, getConnection } from '../../../../utils/db-sql';
import { trackServer } from '@/lib/analytics/server';

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      studentId,
      amount,
    } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // ─── HMAC Signature Verification ───
    // Razorpay generates a signature using: SHA256(order_id + "|" + payment_id, secret)
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature mismatch - possible tampering detected.');
      return NextResponse.json(
        { error: 'Payment verification failed: Invalid signature. Transaction rejected.' },
        { status: 400 }
      );
    }

    // ─── Signature Valid - Enroll Student & Log Transaction ───
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // Check if already enrolled
      const [existsRows] = await conn.execute(
        'SELECT student_id FROM atelier_student_courses WHERE student_id = ? AND course_id = ?',
        [studentId, courseId]
      );

      if (existsRows.length === 0) {
        // Enroll student in course
        await conn.execute(
          'INSERT INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)',
          [studentId, courseId]
        );
      }

      // Fetch student & course details for transaction log
      const [studentRows] = await conn.execute(
        'SELECT name FROM atelier_students WHERE id = ?',
        [studentId]
      );
      const [courseRows] = await conn.execute(
        'SELECT title FROM atelier_courses WHERE id = ?',
        [courseId]
      );

      const studentName = studentRows.length > 0 ? studentRows[0].name : 'Unknown Student';
      const courseTitle = courseRows.length > 0 ? courseRows[0].title : 'Unknown Course';

      // Log verified transaction with Razorpay metadata
      await conn.execute(
        `INSERT INTO atelier_transactions 
         (student_id, student_name, course_id, course_title, amount, timestamp, status, razorpay_order_id, razorpay_payment_id, razorpay_signature) 
         VALUES (?, ?, ?, ?, ?, ?, 'Verified', ?, ?, ?)`,
        [
          studentId,
          studentName,
          courseId,
          courseTitle,
          amount || 'N/A',
          new Date().toISOString(),
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        ]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    // Authoritative Server-side Analytics Event (Non-blocking)
    try {
      trackServer('payment_success', {
        userId: Number(studentId),
        role: 'student',
        courseId: Number(courseId),
        metadata: {
          amount: amount || '4999',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        }
      });
      trackServer('course_enrolled', {
        userId: Number(studentId),
        role: 'student',
        courseId: Number(courseId)
      });
    } catch (e) {
      // Never interfere with payment response
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and enrollment completed.',
    });
  } catch (error) {
    console.error('Payment verification failed:', error);
    try {
      trackServer('payment_failed', {
        source: '/api/razorpay/verify-payment',
        metadata: { error: error.message }
      });
    } catch (e) {}

    return NextResponse.json(
      { error: 'Payment verification failed. Please contact support.' },
      { status: 500 }
    );
  }
}

