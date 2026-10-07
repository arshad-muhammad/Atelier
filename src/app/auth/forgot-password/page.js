'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { requestPasswordReset, verifyAndResetPassword, resendPasswordResetOtp } from '../../actions';
import styles from '../auth.module.css';

function getStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: s, label: labels[s] };
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: request code, 2: verify & reset, 3: success
  const [email, setEmail] = useState('');
  const [stateId, setStateId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef(null);

  const isEmailValid = email.trim().length > 0 && email.includes('@');
  const isResetValid = password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword;

  const strength = useMemo(() => getStrength(password), [password]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [step, countdown]);

  const startCountdown = () => {
    setCountdown(60);
  };

  // Step 1: Request 6-digit code via MojoAuth email
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await requestPasswordReset(email.trim());
      if (res && res.success && res.stateId) {
        setStateId(res.stateId);
        setStep(2);
        setCode('');
        startCountdown();
      } else {
        setError(res?.error || "We couldn't process this request. Please check your email address and try again.");
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Server Components render') || msg.includes('digest')) {
        setError("No account found with this email address. Please check your spelling or sign up.");
      } else {
        setError(msg || "We couldn't process this request. Please check your email address and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (countdown > 0 || resending) return;
    setError('');
    setResending(true);

    try {
      const res = await resendPasswordResetOtp(stateId, email.trim());
      if (res && res.success) {
        if (res.state_id || res.stateId) {
          setStateId(res.state_id || res.stateId);
        }
        startCountdown();
      } else {
        setError(res?.error || 'Failed to resend verification code. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify code and reset password
  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyAndResetPassword(email.trim(), cleanCode, password, stateId);
      if (res && res.success) {
        setStep(3);
      } else {
        setError(res?.error || 'Invalid or expired verification code. Please try again.');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Server Components render') || msg.includes('digest')) {
        setError('Invalid or expired verification code. Please try again.');
      } else {
        setError(msg || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background layers */}
      <div className={styles.bgGrid} />
      <div className={styles.glow} />

      {/* Form card */}
      <div className={styles.card}>
        <div className={styles.badge}>
          {step === 1 ? 'PASSWORD RECOVERY' : step === 2 ? 'VERIFY & RESET' : 'SUCCESS'}
        </div>

        {step === 1 && (
          <>
            <h1 className={styles.heading}>Forgot password?</h1>
            <p className={styles.subtext}>
              Enter your account email and we&apos;ll send a 6-digit verification code to reset your password.
            </p>

            <form onSubmit={handleRequestCode}>
              {error && (
                <div className={styles.errorBanner}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="forgot-email">
                    Account Email
                  </label>
                  <input
                    id="forgot-email"
                    className={styles.input}
                    type="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${styles.submitBtn} ${loading ? styles.loadingBtn : ''}`}
                disabled={loading || !isEmailValid}
              >
                {loading ? (
                  <span className={styles.btnContent}>
                    <span className={styles.spinner} />
                    Sending Code...
                  </span>
                ) : (
                  <span className={styles.btnContent}>
                    Send Verification Code
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={styles.heading}>Reset your password</h1>
            <p className={styles.subtext}>
              Enter the 6-digit verification code sent to your email and create a new password.
            </p>

            {/* Email destination indicator */}
            <div className={styles.otpTargetCard}>
              <div className={styles.otpTargetInfo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className={styles.otpEmailText}>{email}</span>
              </div>
              <button
                type="button"
                className={styles.otpChangeBtn}
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
              >
                Change
              </button>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndReset}>
              <div className={styles.fieldGroup}>
                {/* 6-digit Code */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="verification-code">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="verification-code"
                    className={styles.codeInput}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {/* Resend actions row */}
                <div className={styles.otpActionsRow}>
                  <span className={styles.otpTimerText}>
                    {countdown > 0 ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Resend code in {countdown}s
                      </>
                    ) : (
                      "Didn't receive code?"
                    )}
                  </span>
                  <button
                    type="button"
                    className={styles.otpResendBtn}
                    onClick={handleResendCode}
                    disabled={countdown > 0 || resending}
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>

                {/* New Password */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="new-password">
                    New Password
                  </label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="new-password"
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {password && (
                    <>
                      <div className={styles.strengthBar}>
                        {[1, 2, 3, 4].map((i) => {
                          let cls = styles.strengthSegment;
                          if (strength.score >= i) {
                            if (strength.score <= 1) cls += ` ${styles.active}`;
                            else if (strength.score <= 2) cls += ` ${styles.medium}`;
                            else cls += ` ${styles.strong}`;
                          }
                          return <div key={i} className={cls} />;
                        })}
                      </div>
                      <p className={styles.strengthLabel}>{strength.label}</p>
                    </>
                  )}
                </div>

                {/* Confirm Password */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    className={styles.input}
                    type="password"
                    required
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${styles.submitBtn} ${loading ? styles.loadingBtn : ''}`}
                disabled={loading || !isResetValid}
              >
                {loading ? (
                  <span className={styles.btnContent}>
                    <span className={styles.spinner} />
                    Updating Password...
                  </span>
                ) : (
                  <span className={styles.btnContent}>
                    Save New Password
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div className={styles.successCard}>
            <div className={styles.successIconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className={styles.heading} style={{ marginBottom: '0.75rem' }}>Password updated!</h1>
            <p className={styles.subtext} style={{ marginBottom: '2rem' }}>
              Your account password has been successfully reset. You can now sign in with your new credentials.
            </p>
            <Link href="/auth/signin" className={styles.submitBtn}>
              <span className={styles.btnContent}>
                Sign In Now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          </div>
        )}

        {/* Card footer */}
        {step !== 3 && (
          <p className={styles.cardFooter}>
            Remembered your password?{' '}
            <Link href="/auth/signin">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
