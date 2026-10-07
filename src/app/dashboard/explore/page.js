'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentProfileByEmail, getCourses, registerStudentToCourse } from '../../actions';
import CheckoutModal from '@/components/CheckoutModal';
import styles from './explore.module.css';

export default function DashboardExplorePage() {
  const router = useRouter();
  const [coursesList, setCoursesList] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [checkoutCourse, setCheckoutCourse] = useState(null);

  const loadData = async () => {
    const email = localStorage.getItem('loggedInStudentEmail');
    if (!email) {
      const allCourses = await getCourses();
      setCoursesList(allCourses);
      return;
    }

    const [student, allCourses] = await Promise.all([
      getStudentProfileByEmail(email),
      getCourses()
    ]);
    
    if (student) {
      setActiveStudent(student);
      setEnrolledIds(student.enrolledCourses || []);
    }

    setCoursesList(allCourses);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('courseChanged', loadData);
    return () => window.removeEventListener('courseChanged', loadData);
  }, []);

  const handleRegisterClick = (courseId) => {
    if (!activeStudent) {
      router.push('/auth/signin');
      return;
    }

    const targetCourse = coursesList.find(c => c.id === courseId);
    if (targetCourse) {
      setCheckoutCourse(targetCourse);
    }
  };

  const handlePaymentSuccess = () => {
    if (!checkoutCourse) return;
    
    // Update cached student profile with new enrolled courses
    const cached = localStorage.getItem('studentProfile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const newEnrolled = Array.from(new Set([...(parsed.enrolledCourses || []), checkoutCourse.id]));
        parsed.enrolledCourses = newEnrolled;
        localStorage.setItem('studentProfile', JSON.stringify(parsed));
      } catch (e) {}
    }

    // Update active course selection
    localStorage.setItem('activeCourseId', checkoutCourse.id.toString());
    
    setCheckoutCourse(null);
    
    // Dispatch events
    window.dispatchEvent(new Event('profileChanged'));
    window.dispatchEvent(new Event('courseChanged'));

    // Direct navigate to My Courses to show the freshly added course
    router.push('/dashboard/my-courses');
  };

  return (
    <div className={styles.exploreWrapper}>
      {checkoutCourse && (
        <CheckoutModal
          course={checkoutCourse}
          student={activeStudent}
          onClose={() => setCheckoutCourse(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      <h2 className={styles.headerTitle}>
        Explore New Cohort Paths
      </h2>
      <p className={styles.headerSubtitle}>
        Enroll in specialized tracks to broaden your skills, build production-ready projects, and attend live sessions.
      </p>

      {/* Catalog card grid */}
      <div className={styles.grid}>
        {coursesList.map((course) => {
          const isEnrolled = enrolledIds.includes(course.id);
          const badges = course.badges || [];

          return (
            <div key={course.id} className={styles.card}>
              
              {/* Course Thumbnail Image with Status Indicators */}
              <div className={styles.imageWrapper}>
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className={styles.image} 
                />
                
                {isEnrolled ? (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(10, 10, 12, 0.88)',
                    border: '1px solid rgba(48, 209, 88, 0.4)',
                    backdropFilter: 'blur(8px)',
                    color: '#30d158',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 10
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', boxShadow: '0 0 6px #30d158' }} />
                    ALREADY ENROLLED
                  </span>
                ) : (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(10, 10, 12, 0.88)',
                    border: '1px solid rgba(242, 85, 34, 0.4)',
                    backdropFilter: 'blur(8px)',
                    color: '#f25522',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 10
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f25522', boxShadow: '0 0 6px #f25522' }} />
                    Live Cohort
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                {/* Pill badges */}
                <div className={styles.badgeList}>
                  {isEnrolled && (
                    <span className={`${styles.cardBadge} ${styles.badgeEnrolled}`}>
                      ✓ Active
                    </span>
                  )}
                  {badges.map((badge, idx) => (
                    <span key={idx} className={styles.cardBadge}>
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Course Title */}
                <h3 className={styles.courseTitle}>
                  {course.title}
                </h3>

                {/* Course description if available */}
                {course.description && (
                  <p className={styles.courseDesc}>
                    {course.description}
                  </p>
                )}

                {/* Price or Enrolled Status Banner */}
                {isEnrolled ? (
                  <div className={styles.purchasedBanner}>
                    <span className={styles.purchasedText}>
                      ✓ Lifetime Access Unlocked
                    </span>
                    <span className={styles.purchasedBadge}>
                      Enrolled
                    </span>
                  </div>
                ) : (
                  <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Fee</span>
                    <span className={styles.priceValue}>{course.price || 'Free'}</span>
                    {course.originalPrice && (
                      <span className={styles.originalPrice}>{course.originalPrice}</span>
                    )}
                    {course.discount && (
                      <span className={styles.discountBadge}>{course.discount}</span>
                    )}
                  </div>
                )}

                {/* Action button */}
                {isEnrolled ? (
                  <button 
                    className={`${styles.actionBtn} ${styles.actionBtnEnrolled}`}
                    onClick={() => {
                      localStorage.setItem('activeCourseId', course.id.toString());
                      window.dispatchEvent(new Event('courseChanged'));
                      router.push('/dashboard');
                    }}
                  >
                    Open Workspace &rarr;
                  </button>
                ) : (
                  <button 
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    onClick={() => handleRegisterClick(course.id)}
                  >
                    Enroll in Cohort
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
