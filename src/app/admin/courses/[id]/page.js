'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStudents, getCourses, getLecturers, saveStudent } from '../../../actions';
import styles from '../../admin.module.css';

export default function CourseDetailsAdmin() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id, 10);

  const [authorized, setAuthorized] = useState(false);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  // Check auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isClear = sessionStorage.getItem('adminCleared') === 'true' || Boolean(sessionStorage.getItem('adminSessionToken'));
      if (isClear) {
        setAuthorized(true);
      }
    }
  }, []);

  const loadData = async () => {
    const allCourses = await getCourses();
    const foundCourse = allCourses.find(c => c.id === courseId);
    setCourse(foundCourse);
    
    setStudents(await getStudents());
    setLecturers(await getLecturers());
  };

  // Load database lists
  useEffect(() => {
    if (!authorized) return;
    loadData();
    window.addEventListener('courseChanged', loadData);
    return () => window.removeEventListener('courseChanged', loadData);
  }, [authorized]);

  const handleUnenroll = async (studentId) => {
    if (!confirm('Are you sure you want to unenroll this student from the cohort?')) return;

    try {
      const allStudents = await getStudents();
      const student = allStudents.find(s => s.id === studentId);
      if (student) {
        student.enrolledCourses = (student.enrolledCourses || []).filter(id => id !== courseId);
        await saveStudent(student);
        
        // Reload list
        setStudents(allStudents.map(s => s.id === studentId ? student : s));
        
        // Dispatch sync events
        window.dispatchEvent(new Event('courseChanged'));
        window.dispatchEvent(new Event('profileChanged'));
      }
    } catch (err) {
      console.error(err);
      alert("Error unenrolling student.");
    }
  };

  if (!authorized) {
    return (
      <div className={styles.gateWrapper}>
        <div className={styles.gateCard}>
          <h2 className={styles.gateTitle}>Access Denied</h2>
          <p className={styles.gateSubtitle}>You must authorize first at the main admin console gate.</p>
          <button onClick={() => router.push('/admin')} className={styles.gateBtn}>
            Go to Admin Gate
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.adminShell} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-orange)' }}>Error 404: Course Node Not Found</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>The requested course ID is not defined in active database blocks.</p>
          <button onClick={() => router.push('/admin')} className={styles.gateBtn} style={{ marginTop: '1.5rem', width: 'auto', padding: '0.5rem 1rem' }}>
            ✕ Return to Console
          </button>
        </div>
      </div>
    );
  }

  // Find instructor details
  const instructor = lecturers.find(l => l.id === course.instructorId);

  // Filter students enrolled in this course
  const enrolledStudents = students.filter(s => s.enrolledCourses && s.enrolledCourses.includes(courseId));

  return (
    <div className={styles.adminShell}>
      {/* Header bar */}
      <header className={styles.adminHeader}>
        <div className={styles.adminTitleBlock}>
          <img src="/logo.png" alt="Atelier" style={{ width: '28px', height: '28px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.2rem' }}>
            Course Inspection Block: #{course.id}
          </h2>
          <span className={styles.adminBadge} style={{ background: 'rgba(242, 85, 34, 0.08)', color: 'var(--accent-orange)' }}>
            Cohort Analyzer
          </span>
        </div>
        <button 
          onClick={() => router.push('/admin')}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          ← Main Console
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.adminMain} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Course details card */}
        <div style={{ background: '#09090a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <img 
              src={course.image || '/images/course_cohort_2.png'} 
              alt={course.title} 
              style={{ width: '130px', height: '74px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} 
              onError={(e) => { e.currentTarget.src = '/images/course_cohort_2.png'; }}
            />
            <div>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cohort Information block</span>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem', color: '#ffffff' }}>
                {course.title}
              </h1>
              {course.subtitle && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>{course.subtitle}</p>}
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
            {course.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Pricing & Offers</span>
              <p style={{ color: '#2ecc71', fontWeight: '800', fontSize: '1.2rem', marginTop: '0.2rem' }}>
                {course.price} <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontWeight: '400', marginLeft: '0.5rem' }}>{course.originalPrice}</span>
                <span style={{ color: 'var(--accent-orange)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({course.discount})</span>
              </p>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Starting of Batch</span>
              <p style={{ color: '#ff9800', fontWeight: '700', fontSize: '1.1rem', marginTop: '0.2rem' }}>
                {course.batchStartDate || 'Immediate'}
              </p>
            </div>
            
            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Course Instructor</span>
              <p style={{ color: '#ffffff', fontWeight: '600', fontSize: '1rem', marginTop: '0.2rem' }}>
                {instructor ? `${instructor.name} (${instructor.expertise})` : 'Unassigned'}
              </p>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Features List</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.25rem' }}>
                {course.badges && course.badges.map((b, i) => (
                  <span key={i} className={styles.adminBadge} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}>{b}</span>
                ))}
              </div>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Active Enrollment Metric</span>
              <p style={{ color: 'var(--accent-orange)', fontWeight: '800', fontSize: '1.2rem', marginTop: '0.2rem' }}>
                {enrolledStudents.length} Students Enrolled
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Students List */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Enrolled Student Ledger
          </h3>
          
          <div className={styles.tableWrapper}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>College Details</th>
                  <th>XP Points</th>
                  <th>Streak</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td style={{ fontWeight: '600' }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.phone || 'N/A'}</td>
                    <td>{s.college} ({s.gradYear})</td>
                    <td>{s.xp} XP</td>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: '600' }}>{s.streak} Days</td>
                    <td>
                      <button 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                        onClick={() => handleUnenroll(s.id)}
                      >
                        Unenroll
                      </button>
                    </td>
                  </tr>
                ))}
                {enrolledStudents.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem' }}>
                      No students are currently enrolled in this cohort database block.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
