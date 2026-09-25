'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStudents, getCourses, getLecturers } from '../../../actions';
import styles from '../../admin.module.css';

export default function LecturerDetailsAdmin() {
  const params = useParams();
  const router = useRouter();
  const lecturerId = parseInt(params.id, 10);

  const [authorized, setAuthorized] = useState(false);
  const [lecturer, setLecturer] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

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
    const allLecturers = await getLecturers();
    const foundLecturer = allLecturers.find(l => l.id === lecturerId);
    setLecturer(foundLecturer);
    
    setCourses(await getCourses());
    setStudents(await getStudents());
  };

  // Load database lists
  useEffect(() => {
    if (!authorized) return;
    loadData();
    window.addEventListener('courseChanged', loadData);
    return () => window.removeEventListener('courseChanged', loadData);
  }, [authorized]);

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

  if (!lecturer) {
    return (
      <div className={styles.adminShell} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-orange)' }}>Error 404: Lecturer Node Not Found</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>The requested lecturer ID is not defined in active database blocks.</p>
          <button onClick={() => router.push('/admin')} className={styles.gateBtn} style={{ marginTop: '1.5rem', width: 'auto', padding: '0.5rem 1rem' }}>
            ✕ Return to Console
          </button>
        </div>
      </div>
    );
  }

  // Find courses assigned to this lecturer
  const assignedCourses = courses.filter(c => (lecturer.assignedCourses || []).some(id => Number(id) === Number(c.id)) || c.instructorId === lecturerId);
  const assignedCourseIds = assignedCourses.map(c => c.id);

  // Filter students under this lecturer
  const activeStudents = students.filter(s => s.enrolledCourses && s.enrolledCourses.some(cId => assignedCourseIds.includes(cId)));

  return (
    <div className={styles.adminShell}>
      {/* Header bar */}
      <header className={styles.adminHeader}>
        <div className={styles.adminTitleBlock}>
          <img src="/logo.png" alt="Atelier" style={{ width: '28px', height: '28px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.2rem' }}>
            Lecturer Profile Block: #{lecturer.id}
          </h2>
          <span className={styles.adminBadge} style={{ background: 'rgba(46, 204, 113, 0.08)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
            Instructor Node
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
        
        {/* Lecturer details card */}
        <div style={{ background: '#09090a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty Profile block</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem', color: '#ffffff' }}>
            {lecturer.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: '1.5' }}>
            {lecturer.bio}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Contact Email</span>
              <p style={{ color: '#ffffff', fontWeight: '600', fontSize: '1rem', marginTop: '0.2rem' }}>
                {lecturer.email}
              </p>
            </div>
            
            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Expertise Focus</span>
              <p style={{ color: '#2ecc71', fontWeight: '600', fontSize: '1rem', marginTop: '0.2rem' }}>
                {lecturer.expertise}
              </p>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Assigned Cohorts</span>
              <p style={{ color: 'var(--accent-orange)', fontWeight: '800', fontSize: '1.2rem', marginTop: '0.2rem' }}>
                {assignedCourses.length} Courses Taught
              </p>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Active Student Count</span>
              <p style={{ color: 'var(--accent-orange)', fontWeight: '800', fontSize: '1.2rem', marginTop: '0.2rem' }}>
                {activeStudents.length} Students
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Courses Table */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Assigned Cohorts
          </h3>
          <div className={styles.tableWrapper}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cohort Title</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Badges</th>
                </tr>
              </thead>
              <tbody>
                {assignedCourses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td style={{ fontWeight: '600' }}>{c.title}</td>
                    <td>{c.price || 'Free'}</td>
                    <td>{c.discount || 'N/A'}</td>
                    <td>{c.badges ? c.badges.join(', ') : 'None'}</td>
                  </tr>
                ))}
                {assignedCourses.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>
                      No cohorts are currently assigned to this lecturer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Students List */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Active Students
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
                  <th>Enrolled Cohorts</th>
                </tr>
              </thead>
              <tbody>
                {activeStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td style={{ fontWeight: '600' }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.phone || 'N/A'}</td>
                    <td>{s.college} ({s.gradYear})</td>
                    <td>{s.xp} XP</td>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: '600' }}>{s.streak} Days</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {s.enrolledCourses && s.enrolledCourses.map((cId) => {
                          const matchingCourse = courses.find(c => c.id === cId);
                          if (!matchingCourse) return null;
                          return (
                            <span 
                              key={cId} 
                              className={styles.adminBadge} 
                              style={{ 
                                background: assignedCourseIds.includes(cId) ? 'rgba(46, 204, 113, 0.08)' : 'rgba(255,255,255,0.03)', 
                                border: assignedCourseIds.includes(cId) ? '1px solid rgba(46, 204, 113, 0.2)' : '1px solid rgba(255,255,255,0.08)',
                                color: assignedCourseIds.includes(cId) ? '#2ecc71' : 'rgba(255,255,255,0.5)'
                              }}
                            >
                              {matchingCourse.title.split(':')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {activeStudents.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem' }}>
                      No students are currently active under this lecturer.
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
