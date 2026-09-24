import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, currency, courseId, courseTitle, studentId, studentName } = await request.json();

    // Validate required fields
    if (!amount || !courseId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, courseId, studentId' },
        { status: 400 }
      );
    }

    // Parse amount - strip currency words/symbols like "Rs. ", "Rs", "₹", "INR", and commas, convert to paise
    let amountInPaise;
    if (typeof amount === 'number') {
      amountInPaise = Math.round(amount * 100);
    } else if (typeof amount === 'string') {
      // Strip any prefix before the first digit (handles 'Rs. ', '₹', 'INR ', etc. without retaining the period from 'Rs.')
      const cleaned = amount.replace(/^[^\d]+/, '').replace(/,/g, '').trim();
      const parsed = parseFloat(cleaned);
      amountInPaise = Math.round(parsed * 100);
    } else {
      amountInPaise = NaN;
    }

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount value' },
        { status: 400 }
      );
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
      return NextResponse.json(
        { error: 'Razorpay payment gateway is not properly configured. Missing server credentials.' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt = `rcpt_${courseId}_${studentId}_${Date.now()}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt,
      notes: {
        courseId: String(courseId),
        courseTitle: String(courseTitle || '').slice(0, 255),
        studentId: String(studentId),
        studentName: String(studentName || '').slice(0, 255),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    const detail = error?.error?.description || error?.message || 'Failed to create payment order.';
    return NextResponse.json(
      { error: detail },
      { status: 500 }
    );
  }
}
