'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initiateStudentSignupWithOtp, verifyStudentSignupOtp, resendStudentOtp } from '../../actions';
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

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [stateId, setStateId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef(null);

  const isSignUpValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    mobile.trim().length > 0 &&
    password.length >= 8;
  const isOtpValid = otp.trim().length === 6;

  const strength = useMemo(() => getStrength(password), [password]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [step, countdown]);

  const startCountdown = () => {
    setCountdown(60);
  };

  // Step 1: Validate registration info and dispatch OTP
  const handleInitiateSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first and last name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const cleanEmail = email.trim().toLowerCase();

      const res = await initiateStudentSignupWithOtp(
        fullName,
        cleanEmail,
        password,
        mobile.trim(),
        'Atelier Student',
        '2026'
      );

      if (res && res.success) {
        localStorage.setItem('loggedInStudentEmail', cleanEmail);
        localStorage.setItem('studentProfile', JSON.stringify({
          name: fullName,
          email: cleanEmail,
          phone: mobile.trim() || '',
          college: 'Atelier Student',
          gradYear: '2026',
          bio: 'Aspiring Full Stack Engineer and AI enthusiast.',
          github: '',
          linkedin: '',
          portfolio: '',
          skills: ['HTML', 'CSS', 'JavaScript'],
          avatar: null,
          enrolledCourses: []
        }));

        window.dispatchEvent(new Event('profileChanged'));
        window.dispatchEvent(new Event('courseChanged'));

        router.push('/dashboard/onboarding');
      } else {
        setError(res?.error || 'Unable to start registration. Please check your details and try again.');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Server Components render') || msg.includes('digest')) {
        setError('An account with this email may already exist. Please sign in instead.');
      } else {
        setError(msg || 'Failed to request verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize database account creation
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const cleanEmail = email.trim().toLowerCase();

      const res = await verifyStudentSignupOtp({
        name: fullName,
        email: cleanEmail,
        password,
        phone: mobile.trim(),
        college: 'Atelier Student',
        gradYear: '2026',
        stateId,
        otp: cleanOtp,
      });

      if (res && res.success !== false && (res.student || res.email)) {
        const student = res.student || res;
        localStorage.setItem('loggedInStudentEmail', student.email);
        localStorage.setItem('studentProfile', JSON.stringify({
          name: student.name,
          email: student.email,
          phone: student.phone || mobile || '',
          college: student.college || 'Atelier Student',
          gradYear: student.gradYear || '2026',
          bio: student.bio || 'Aspiring Full Stack Engineer and AI enthusiast.',
          github: student.github || '',
          linkedin: student.linkedin || '',
          portfolio: student.portfolio || '',
          skills: student.skills || ['HTML', 'CSS', 'JavaScript'],
          avatar: student.avatar || null,
          enrolledCourses: student.enrolledCourses || []
        }));

        window.dispatchEvent(new Event('profileChanged'));
        window.dispatchEvent(new Event('courseChanged'));

        router.push('/dashboard/onboarding');
      } else {
        setError(res?.error || 'Verification failed or expired code. Please try again.');
      }
    } catch (err) {
      const msg = err?.message || '';
      setError(msg || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setError('');
    setResending(true);

    try {
      const res = await resendStudentOtp(stateId);
      if (res && res.success) {
        if (res.state_id) setStateId(res.state_id);
        startCountdown();
      } else {
        setError(res?.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleLiveOAuth = (provider) => {
    setError('');
    const targetRoute = provider === 'google' ? '/api/auth/google' : '/api/auth/github';
    window.location.href = `${targetRoute}?returnTo=/dashboard/onboarding`;
  };

  const barClass = (index) => {
    if (strength.score < index) return styles.bar;
    if (strength.score <= 1) return `${styles.bar} ${styles.barWeak}`;
    if (strength.score === 2) return `${styles.bar} ${styles.barFair}`;
    if (strength.score === 3) return `${styles.bar} ${styles.barGood}`;
    return `${styles.bar} ${styles.barStrong}`;
  };

  return (
    <div className={styles.page}>
      {/* Background layers */}
      <div className={styles.bgGrid} />
      <div className={styles.glow} />

      {/* Form card */}
      <div className={styles.card}>
        <div className={styles.badge}>
          {step === 'form' ? 'NEW BUILDER REGISTRATION' : 'EMAIL VERIFICATION'}
        </div>

        {step === 'form' ? (
          <>
            <h1 className={styles.heading}>Create your account</h1>
            <p className={styles.subtext}>
              Join the elite cohort of engineers building real products.
            </p>

            <form onSubmit={handleInitiateSignUp}>
              {error && (
                <div className={styles.errorBanner}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.fieldGroup}>
                {/* Name row */}
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="signup-fn">
                      First Name
                    </label>
                    <input
                      id="signup-fn"
                      className={styles.input}
                      type="text"
                      required
                      placeholder="Alex"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="signup-ln">
                      Last Name
                    </label>
                    <input
                      id="signup-ln"
                      className={styles.input}
                      type="text"
                      required
                      placeholder="Rivera"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="signup-email">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    className={styles.input}
                    type="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Mobile */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="signup-mobile">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="signup-mobile"
                    className={styles.input}
                    type="tel"
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="signup-password">
                    Password
                  </label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="signup-password"
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
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {password && (
                    <div className={styles.strengthWrapper}>
                      <div className={styles.strengthBars}>
                        <div className={barClass(1)} />
                        <div className={barClass(2)} />
                        <div className={barClass(3)} />
                        <div className={barClass(4)} />
                      </div>
                      {strength.label && (
                        <span className={styles.strengthText}>{strength.label}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`${styles.submitBtn} ${loading ? styles.loadingBtn : ''}`}
                disabled={loading || !isSignUpValid}
              >
                {loading ? (
                  <span className={styles.btnContent}>
                    <span className={styles.spinner} />
                    Creating account...
                  </span>
                ) : (
                  <span className={styles.btnContent}>
                    Get Started
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={styles.divider}>
              <span className={styles.dividerLabel}>or sign up with</span>
            </div>

            {/* Social buttons */}
            <div className={styles.socialRow}>
              <button
                type="button"
                className={styles.socialBtn}
                onClick={() => handleLiveOAuth('google')}
                title="Sign up with Google"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                className={styles.socialBtn}
                onClick={() => handleLiveOAuth('github')}
                title="Sign up with GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                GitHub
              </button>
            </div>

            {/* Terms */}
            <p className={styles.terms}>
              By creating an account you agree to the Terms of Service and Privacy Policy.
            </p>
          </>
        ) : (
          /* Step 2: OTP Verification */
          <>
            <h1 className={styles.heading}>Verify your email</h1>
            <p className={styles.subtext}>
              Enter the 6-digit code sent to <strong style={{ color: '#ffffff' }}>{email}</strong>. If you don&apos;t see it, be sure to check your spam or junk folder.
            </p>

            {/* Email destination indicator */}
            <div className={styles.otpTargetCard}>
              <div className={styles.otpTargetInfo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span className={styles.otpEmailText}>{email}</span>
              </div>
              <button
                type="button"
                className={styles.otpChangeBtn}
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
              >
                Change
              </button>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister}>
              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="signup-otp">
                    6-Digit Code
                  </label>
                  <input
                    id="signup-otp"
                    className={styles.codeInput}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Resend Actions */}
              <div className={styles.otpActionsRow}>
                {countdown > 0 ? (
                  <span className={styles.otpTimerText}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.otpResendBtn}
                    onClick={handleResend}
                    disabled={resending || loading}
                  >
                    {resending ? 'Sending...' : 'Resend code'}
                  </button>
                )}

                <button
                  type="button"
                  className={styles.otpChangeBtn}
                  onClick={() => {
                    setStep('form');
                    setError('');
                  }}
                >
                  Edit Information
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className={`${styles.submitBtn} ${loading ? styles.loadingBtn : ''}`}
                disabled={loading || !isOtpValid}
              >
                {loading ? (
                  <span className={styles.btnContent}>
                    <span className={styles.spinner} />
                    Creating account...
                  </span>
                ) : (
                  <span className={styles.btnContent}>
                    Create Account
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </>
        )}

        {/* Card footer */}
        <p className={styles.cardFooter}>
          Already have an account?{' '}
          <Link href="/auth/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
