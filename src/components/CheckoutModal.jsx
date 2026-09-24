'use client';

import React, { useState, useEffect } from 'react';
import styles from './CheckoutModal.module.css';

export default function CheckoutModal({ course, student, onClose, onSuccess }) {
  const [status, setStatus] = useState('idle'); // idle | loading | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load Razorpay checkout.js SDK dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setSdkLoaded(true);
      script.onerror = () => {
        setErrorMsg('Failed to load Razorpay SDK. Please check your internet connection.');
        setStatus('error');
      };
      document.body.appendChild(script);
    } else {
      setSdkLoaded(true);
    }
  }, []);

  const handlePay = async () => {
    if (!sdkLoaded) {
      setErrorMsg('Razorpay SDK is still loading. Please wait a moment.');
      return;
    }

    if (!student || !student.id) {
      setErrorMsg('Student profile session not found. Please log in again to continue.');
      setStatus('error');
      return;
    }

    if (!course || !course.price) {
      setErrorMsg('Course pricing details unavailable. Please refresh the page.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Step 1: Create an order on the server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: course.price,
          currency: 'INR',
          courseId: course.id,
          courseTitle: course.title,
          studentId: student.id,
          studentName: student.name || 'Student',
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order.');
      }

      setStatus('processing');

      // Step 2: Open Razorpay Checkout Popup
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Atelier Sphere Hive',
        description: course.title,
        order_id: orderData.orderId,
        image: '/logo.png',
        prefill: {
          name: student.name || '',
          email: student.email || '',
          contact: student.phone || '',
        },
        notes: {
          courseId: String(course.id),
          studentId: String(student.id),
        },
        theme: {
          color: '#F25522',
          backdrop_color: 'rgba(0, 0, 0, 0.85)',
        },
        modal: {
          ondismiss: () => {
            setStatus('idle');
          },
        },
        handler: async function (response) {
          // Step 3: Verify payment on the server
          setStatus('processing');

          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                studentId: student.id,
                amount: course.price,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }

            setStatus('success');
            setTimeout(() => {
              onSuccess();
            }, 1800);
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setErrorMsg(verifyErr.message || 'Payment verification failed. Please contact support.');
            setStatus('error');
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setErrorMsg(
          response.error?.description ||
            'Payment was declined by your bank. Please try again or use a different payment method.'
        );
        setStatus('error');
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  // Parse price for display
  const displayPrice = course.price || '₹5,999';

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {/* Header section */}
        <header className={styles.header}>
          <div className={styles.merchantInfo}>
            <div className={styles.logoIcon}>A</div>
            <div>
              <h3 className={styles.merchantName}>Atelier Sphere Hive</h3>
              <span className={styles.merchantDomain}>Secure Checkout</span>
            </div>
          </div>
          <div className={styles.pricingInfo}>
            <span className={styles.amountLabel}>Total Due</span>
            <span className={styles.amount}>{displayPrice}</span>
          </div>
        </header>

        {/* Body content based on status */}
        <div className={styles.body} style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem 2rem' }}>
          
          {status === 'idle' && (
            <div className={styles.inputGroup} style={{ textAlign: 'center', width: '100%' }}>
              {/* Order Summary */}
              <div className={styles.orderSummary}>
                <h4 className={styles.title}>Order Summary</h4>
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Program</span>
                  <span className={styles.summaryValue}>{course.title}</span>
                </div>
                
                {course.duration && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Duration</span>
                    <span className={styles.summaryValue}>{course.duration}</span>
                  </div>
                )}
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Student</span>
                  <span className={styles.summaryValue}>{student.name}</span>
                </div>
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Email</span>
                  <span className={styles.summaryValue}>{student.email}</span>
                </div>

                <div className={styles.summaryDivider} />
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel} style={{ fontWeight: 700 }}>Amount</span>
                  <span className={styles.summaryValue} style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem' }}>{displayPrice}</span>
                </div>

                {course.originalPrice && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Original Price</span>
                    <span className={styles.summaryValue} style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)' }}>{course.originalPrice}</span>
                  </div>
                )}

                {course.discount && (
                  <div className={styles.savingsTag}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    You save {course.discount}
                  </div>
                )}
              </div>

              {/* Security badges */}
              <div className={styles.securityGrid}>
                <div className={styles.securityItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>256-bit SSL</span>
                </div>
                <div className={styles.securityItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Razorpay Verified</span>
                </div>
                <div className={styles.securityItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>PCI DSS Compliant</span>
                </div>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className={styles.processingOverlay}>
              <div className={styles.spinner} />
              <h4 className={styles.processTitle}>Creating secure order...</h4>
              <p className={styles.processDesc}>Initializing Razorpay payment gateway connection...</p>
            </div>
          )}

          {status === 'processing' && (
            <div className={styles.processingOverlay}>
              <div className={styles.spinner} />
              <h4 className={styles.processTitle}>Verifying payment...</h4>
              <p className={styles.processDesc}>Confirming transaction with Razorpay servers and provisioning your workspace...</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.processingOverlay}>
              <div className={styles.successCheck}>✓</div>
              <h4 className={styles.processTitle} style={{ color: '#34c759' }}>Payment Verified!</h4>
              <p className={styles.processDesc}>
                Your enrollment has been confirmed.<br />
                Redirecting to your workspace...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.processingOverlay}>
              <div className={styles.errorIcon}>✕</div>
              <h4 className={styles.processTitle} style={{ color: '#ff4d4d' }}>Payment Failed</h4>
              <p className={styles.processDesc}>{errorMsg}</p>
              <button 
                className={styles.retryBtn}
                onClick={() => { setStatus('idle'); setErrorMsg(''); }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        {(status === 'idle') && (
          <footer className={styles.footer}>
            <div className={styles.secureBadge}>
              <svg className={styles.secureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Powered by Razorpay
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.payBtn} 
                onClick={handlePay}
                disabled={!sdkLoaded}
              >
                {sdkLoaded ? 'Pay Now' : 'Loading...'}
              </button>
            </div>
          </footer>
        )}

        {/* Close button for error state */}
        {status === 'error' && (
          <footer className={styles.footer}>
            <div />
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Close
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
