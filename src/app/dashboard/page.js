'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudentProfileByEmail, getCourses, saveCallback } from '../actions';
import styles from './dashboard.module.css';

export default function StudentDashboard({ activeCourseId = 1, enrolledCourses = [] }) {
  const [activeNode, setActiveNode] = useState(2); // Node 2 is active by default
  const [showDrawer, setShowDrawer] = useState(false);
  const [streak, setStreak] = useState(1);
  const [studentName, setStudentName] = useState('Student Builder');
  const [toastMessage, setToastMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [enrolledList, setEnrolledList] = useState(enrolledCourses);
  const [currentCourseId, setCurrentCourseId] = useState(activeCourseId);
  const [allCourses, setAllCourses] = useState([]);
  
  // Form input states
  const [hotlineTopic, setHotlineTopic] = useState('');
  const [hotlinePhone, setHotlinePhone] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);

  // Reset active node index on course switch
  useEffect(() => {
    setActiveNode(2);
  }, [currentCourseId]);

  // Sync profile details and active course with instant local cache + background check
  useEffect(() => {
    const syncCurrentCourse = (enrolled = null) => {
      const list = enrolled || enrolledList;
      const saved = localStorage.getItem('activeCourseId');
      let targetId = saved ? parseInt(saved, 10) : activeCourseId;
      if (list && list.length > 0) {
        if (!targetId || !list.includes(targetId)) {
          targetId = list[0];
          localStorage.setItem('activeCourseId', targetId.toString());
        }
      }
      if (targetId && !isNaN(targetId)) {
        setCurrentCourseId(targetId);
      }
    };

    const cached = localStorage.getItem('studentProfile');
    if (cached) {
      try {
        const p = JSON.parse(cached);
        if (p.name) setStudentName(p.name);
        if (p.streak !== undefined) setStreak(p.streak);
        if (p.phone) setHotlinePhone(p.phone);
        if (Array.isArray(p.enrolledCourses)) {
          setEnrolledList(p.enrolledCourses);
          syncCurrentCourse(p.enrolledCourses);
        }
      } catch (e) {}
    }

    const loadCoursesList = async () => {
      try {
        const list = await getCourses();
        setAllCourses(list || []);
      } catch (err) {
        console.error('Error fetching courses for workbench:', err);
      }
    };
    loadCoursesList();

    const syncProfile = async () => {
      const email = localStorage.getItem('loggedInStudentEmail');
      if (!email) return;
      const student = await getStudentProfileByEmail(email);
      if (student) {
        setStreak(student.streak || 0);
        setStudentName(student.name);
        setHotlinePhone(student.phone || '');
        if (Array.isArray(student.enrolledCourses)) {
          setEnrolledList(student.enrolledCourses);
          syncCurrentCourse(student.enrolledCourses);
        }
      }
    };
    syncProfile();

    const onCourseChange = () => {
      syncCurrentCourse();
      loadCoursesList();
    };

    window.addEventListener('profileChanged', syncProfile);
    window.addEventListener('courseChanged', onCourseChange);
    return () => {
      window.removeEventListener('profileChanged', syncProfile);
      window.removeEventListener('courseChanged', onCourseChange);
    };
  }, []);

  const handleSelectCourse = (courseId) => {
    setCurrentCourseId(courseId);
    localStorage.setItem('activeCourseId', courseId.toString());
    setActiveNode(2);
    window.dispatchEvent(new Event('courseChanged'));
    const matched = allCourses.find((c) => c && Number(c.id) === Number(courseId));
    const rawTitle = matched?.title || `Cohort #${courseId}`;
    const title = rawTitle.includes(':') ? rawTitle.split(':')[0].trim() : rawTitle;
    showToast(`Switched to ${title} workspace`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const activeCourseObj = allCourses.find((c) => c && Number(c.id) === Number(currentCourseId));
  const rawActiveTitle = activeCourseObj?.title || '';
  const activeCourseTitle = rawActiveTitle
    ? (rawActiveTitle.includes(':') ? rawActiveTitle.split(':')[0].trim() : rawActiveTitle)
    : (currentCourseId === 2 ? 'System Design' : 'Full-Stack Web');
  const courseTitleLower = rawActiveTitle.toLowerCase();

  // Curriculum node tree details based on selected course
  const nodes = currentCourseId === 2 ? [
    { id: 1, label: 'Load Balancers & CDN', x: 250, y: 35, status: 'completed' },
    { id: 2, label: 'Database Partitioning', x: 250, y: 115, status: 'active' },
    { id: 3, label: 'Caching (Redis/Memcached)', x: 150, y: 205, status: 'locked' },
    { id: 4, label: 'Message Queues (Kafka)', x: 350, y: 205, status: 'locked' },
    { id: 5, label: 'Microservices Mesh', x: 250, y: 295, status: 'locked' }
  ] : (courseTitleLower.includes('devops') || courseTitleLower.includes('cloud')) ? [
    { id: 1, label: 'Containerization (Docker)', x: 250, y: 35, status: 'completed' },
    { id: 2, label: 'CI/CD Pipelines (GitHub)', x: 250, y: 115, status: 'active' },
    { id: 3, label: 'Kubernetes Clusters', x: 150, y: 205, status: 'locked' },
    { id: 4, label: 'Infrastructure as Code', x: 350, y: 205, status: 'locked' },
    { id: 5, label: 'Observability & Metrics', x: 250, y: 295, status: 'locked' }
  ] : (courseTitleLower.includes('ai') || courseTitleLower.includes('python') || courseTitleLower.includes('data')) ? [
    { id: 1, label: 'Python & NumPy Foundations', x: 250, y: 35, status: 'completed' },
    { id: 2, label: 'Data Pipelines & Pandas', x: 250, y: 115, status: 'active' },
    { id: 3, label: 'Machine Learning Models', x: 150, y: 205, status: 'locked' },
    { id: 4, label: 'Neural Networks (PyTorch)', x: 350, y: 205, status: 'locked' },
    { id: 5, label: 'Model Deployment & APIs', x: 250, y: 295, status: 'locked' }
  ] : [
    { id: 1, label: 'HTML/CSS Basics', x: 250, y: 35, status: 'completed' },
    { id: 2, label: 'JavaScript & DOM', x: 250, y: 115, status: 'active' },
    { id: 3, label: 'Database Schemes', x: 150, y: 205, status: 'locked' },
    { id: 4, label: 'API Development', x: 350, y: 205, status: 'locked' },
    { id: 5, label: 'System Design Root', x: 250, y: 295, status: 'locked' }
  ];

  const activeNodeObj = nodes.find((n) => n.id === activeNode) || nodes[1] || nodes[0];

  const getCodeSnippet = () => {
    if (currentCourseId === 2) {
      switch (activeNode) {
        case 1:
          return `// Load Balancer Configuration (Nginx)
upstream backend_servers {
  least_conn; # load balancer algorithm
  server backend1.atelier.academy:8080;
  server backend2.atelier.academy:8080;
  keepalive 32;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend_servers;
  }
}`;
        case 2:
          return `// Horizontal Sharding Key Router
function getShardForUser(userId) {
  // Consistent Hashing implementation
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const numericHash = parseInt(hash.substring(0, 8), 16);
  const shardIndex = numericHash % SHARD_COUNT;
  return shardConnections[shardIndex];
}`;
        default:
          return `// Lesson Locked
// Complete previous topics to view this code.`;
      }
    } else if (courseTitleLower.includes('devops') || courseTitleLower.includes('cloud')) {
      switch (activeNode) {
        case 1:
          return `# Multi-Stage Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "start"]`;
        case 2:
          return `# GitHub Actions CI/CD Pipeline
name: Deploy Pipeline
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and Test
        run: |
          npm ci
          npm test`;
        default:
          return `// Module Locked
// Complete earlier DevOps lessons to unlock this exercise.`;
      }
    } else {
      switch (activeNode) {
        case 1:
          return `// HTML & CSS Component
<div class="card">
  <h3>Project Overview</h3>
  <button id="cta-btn">Get Started</button>
</div>

/* Component Styling */
.card {
  padding: 2rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}`;
        case 2:
          return `// JavaScript DOM Manipulation
const button = document.querySelector('#cta-btn');

button.addEventListener('click', (event) => {
  console.log('Action triggered successfully!');
  event.target.classList.add('active');
});`;
        default:
          return `// Module Locked
// Complete earlier lessons to unlock this exercise.
function lockedNode() {
  return null;
}`;
      }
    }
  };

  const getFilename = () => {
    if (currentCourseId === 2) {
      return activeNode === 1 ? 'nginx/nginx.conf' : 'sharding/router.js';
    }
    if (courseTitleLower.includes('devops') || courseTitleLower.includes('cloud')) {
      return activeNode === 1 ? 'docker/Dockerfile' : '.github/workflows/deploy.yml';
    }
    return 'workspace/sandbox/index.js';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitCallback = async (e) => {
    e.preventDefault();
    setSubmittingCallback(true);
    try {
      const cbData = {
        studentName: studentName,
        phone: hotlinePhone,
        topic: hotlineTopic,
        status: 'Pending'
      };
      await saveCallback(cbData);
      window.dispatchEvent(new Event('courseChanged'));
      setShowDrawer(false);
      showToast(`Callback requested! An instructor will reach out at ${hotlinePhone} shortly.`);
    } catch (err) {
      showToast('Unable to schedule callback. Please try again.');
    } finally {
      setSubmittingCallback(false);
    }
  };

  if (enrolledList.length === 0) {
    return (
      <div className={styles.bentoContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
        <div className={styles.emptyStateCard}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(242, 85, 34, 0.1)',
            border: '1px solid rgba(242, 85, 34, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--accent-orange)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.75rem' }}>
            Welcome to Your Workspace, {studentName}!
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            You haven&apos;t enrolled in any cohort yet. Browse our course catalog to select a cohort, unlock your interactive roadmap, and start building.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/dashboard/explore" className={styles.onboardBtn} style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '0.85rem 1.85rem' }}>
              Explore Cohort Catalog
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/courses" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.85rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: '600'
            }}>
              View Syllabi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bentoContainer}>
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className={styles.dashboardToast}>
          <span style={{ color: 'var(--accent-orange)' }}>◆</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Multi-Cohort Switcher Bar */}
      {enrolledList.length > 1 && (
        <div className={styles.cohortBarWrapper}>
          <div className={styles.cohortBarHeader}>
            <span className={styles.cohortBarLabel}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Workspace Tracks ({enrolledList.length} Active Cohorts)
            </span>
            <span className={styles.cohortBarHint}>
              Click any track below to instantly swap active learning roadmap & workbench
            </span>
          </div>
          <div className={styles.cohortPillsRow}>
            {enrolledList.map((cId) => {
              const matched = allCourses.find((c) => c && Number(c.id) === Number(cId));
              const rawTitle = matched?.title || `Cohort #${cId}`;
              const pillTitle = rawTitle.includes(':') ? rawTitle.split(':')[0].trim() : rawTitle;
              const isSelected = Number(cId) === Number(currentCourseId);
              return (
                <button
                  key={cId}
                  type="button"
                  className={`${styles.cohortPill} ${isSelected ? styles.cohortPillActive : ''}`}
                  onClick={() => handleSelectCourse(cId)}
                  title={`Switch to ${pillTitle}`}
                >
                  <span className={isSelected ? styles.cohortPillDotActive : styles.cohortPillDot} />
                  <span className={styles.cohortPillText}>{pillTitle}</span>
                  {isSelected && <span className={styles.cohortPillBadge}>ACTIVE</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* LEFT DASHBOARD PANEL */}
      <div className={styles.dashboardLeft}>
        
        {/* Learning Roadmap curriculum map */}
        <div className={styles.cardPanel}>
          <div className={styles.cardPanelHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5">
                <circle cx="12" cy="5" r="3" />
                <circle cx="6" cy="19" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M12 8v4" />
                <path d="M12 12l-6 4" />
                <path d="M12 12l6 4" />
              </svg>
              Roadmap: {activeCourseTitle}
            </h2>
            <span className={styles.cardHeaderAction} onClick={() => setActiveNode(2)}>
              Reset View
            </span>
          </div>

          <div className={styles.techTreeContainer}>
            <svg className={styles.treeSvg} viewBox="0 0 500 340">
              {/* Connection Paths */}
              <path d="M 250,35 L 250,115" className={styles.treePathActive} />
              <path d="M 250,115 L 150,205" className={styles.treePath} />
              <path d="M 250,115 L 350,205" className={styles.treePath} />
              <path d="M 150,205 L 250,295" className={styles.treePath} />
              <path d="M 350,205 L 250,295" className={styles.treePath} />

              {/* Node Items */}
              {nodes.map((node) => {
                let statusClass = '';
                if (node.status === 'completed') statusClass = styles.treeNodeCompleted;
                else if (node.status === 'active') statusClass = styles.treeNodeActive;

                return (
                  <g
                    key={node.id}
                    className={`${styles.treeNode} ${statusClass}`}
                    onClick={() => {
                      if (node.id <= 2) {
                        setActiveNode(node.id);
                      }
                    }}
                  >
                    <circle cx={node.x} cy={node.y} r="22" className={styles.treeNodeCircle} />
                    <text x={node.x} y={node.y + 4} className={styles.treeNodeText}>
                      {node.id}
                    </text>
                    {/* Node Tooltip Label on Hover */}
                    <title>{node.label} ({node.status.toUpperCase()})</title>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Touch-friendly Node Milestone Indicators (especially for mobile without hover) */}
          <div className={styles.treeActiveInfo}>
            <div className={styles.treeActiveHeader}>
              <span className={styles.treeActiveTag}>
                {activeNodeObj?.status === 'completed' ? 'Completed Node' : activeNodeObj?.status === 'active' ? 'Active Topic' : 'Locked Node'}
              </span>
              <span className={styles.treeActiveTitle}>Node {activeNode}: {activeNodeObj?.label}</span>
            </div>
            <div className={styles.treeNodePills}>
              {nodes.map((node) => {
                const isSelected = node.id === activeNode;
                const isClickable = node.id <= 2;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`${styles.treeNodePill} ${isSelected ? styles.treeNodePillActive : ''} ${!isClickable ? styles.treeNodePillDisabled : ''}`}
                    onClick={() => {
                      if (isClickable) setActiveNode(node.id);
                    }}
                    title={node.label}
                  >
                    <span className={styles.treeNodePillNum}>{node.id}</span>
                    <span className={styles.treeNodePillText}>{node.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* IDE active code workbench */}
        <div className={styles.cardPanel}>
          <div className={styles.cardPanelHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Interactive Code Preview
            </h2>
            <div className={styles.ideHeaderActions}>
              <span className={styles.cardHeaderAction} onClick={handleCopyCode}>
                {copiedCode ? '✓ Copied' : 'Copy Code'}
              </span>
              <span className={styles.ideFileBadge}>
                {getFilename().split('/').pop()}
              </span>
            </div>
          </div>

          <div className={styles.ideWrapper}>
            <div className={styles.ideHeader}>
              <div className={styles.ideWindowControls}>
                <span className={`${styles.dot} ${styles.dotRed}`} />
                <span className={`${styles.dot} ${styles.dotYellow}`} />
                <span className={`${styles.dot} ${styles.dotGreen}`} />
              </div>
              <span className={styles.ideFilename}>{getFilename()}</span>
            </div>

            <div className={styles.ideBody}>
              <div className={styles.ideGutter}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <div className={styles.ideCodeArea}>
                {getCodeSnippet()}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT DASHBOARD PANEL */}
      <div className={styles.dashboardRight}>
        
        {/* Daily Streak Tracker card */}
        <div className={styles.cardPanel}>
          <div className={styles.cardPanelHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              Daily Streaks Tracker
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.25)', fontSize: '0.72rem', color: '#30d158', fontWeight: '700' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', display: 'inline-block' }} />
              Active Today
            </div>
          </div>

          <div style={{ padding: '0.5rem 0 1.25rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#ffffff', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              {streak} <span style={{ fontSize: '0.95rem', color: 'var(--accent-orange)', letterSpacing: '0.08em' }}>{streak === 1 ? 'DAY STREAK' : 'DAYS ACTIVE'}</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.35rem', lineHeight: '1.45' }}>
              {currentCourseId === 2 ? 'Complete database sharding tasks to unlock cache design nodes.' : `Keep coding daily to unlock advanced topics in ${activeCourseTitle}.`}
            </p>
          </div>

          {/* 7-day Activity Cadence */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
              const isToday = idx === ((new Date().getDay() + 6) % 7);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.68rem', color: isToday ? 'var(--accent-orange)' : 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{day}</span>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isToday ? 'var(--accent-orange)' : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: isToday ? '#000000' : 'rgba(255,255,255,0.4)',
                    fontWeight: '800'
                  }}>
                    {isToday ? '✓' : '·'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Status</span>
              <p style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', marginTop: '0.25rem' }}>Recorded</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cohort Rank</span>
              <p style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--accent-orange)', marginTop: '0.25rem' }}>{streak > 5 ? 'Top 10%' : 'Active Tier'}</p>
            </div>
          </div>
        </div>

        {/* Mentor Callback card */}
        <div className={styles.cardPanel} style={{ background: 'radial-gradient(circle at top right, rgba(242, 85, 34, 0.08) 0%, transparent 75%), #08080a' }}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            1-on-1 Mentor Support
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Have questions or stuck on an exercise? Request a quick 1-on-1 callback from one of our cohort mentors.
          </p>

          <button 
            className={styles.onboardBtn} 
            style={{ width: '100%' }}
            onClick={() => {
              setHotlineTopic(currentCourseId === 2 ? (activeNode === 1 ? 'Nginx load balancing questions' : 'Database sharding implementation') : (activeNode === 1 ? `${activeCourseTitle}: Foundations inquiry` : `${activeCourseTitle}: Implementation questions`));
              setShowDrawer(true);
            }}
          >
            Request Mentor Call
          </button>
        </div>

        {/* ATS Resume Checker card */}
        <div className={styles.cardPanel} style={{ background: 'radial-gradient(circle at top right, rgba(242, 85, 34, 0.12) 0%, transparent 75%), #08080a', border: '1px solid rgba(242, 85, 34, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              ATS Resume Checker
            </h2>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(242, 85, 34, 0.15)', color: 'var(--accent-orange)', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid rgba(242, 85, 34, 0.3)' }}>
              FREE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Scan your resume with our self-hosted BGE ATS scanner. Get compatibility score, keyword gap analysis, and recruiter insights.
          </p>

          <Link 
            href="/resume-checker"
            className={styles.onboardBtn} 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <span>Scan My Resume</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>

      {/* Mentor Support slide-out Drawer overlay */}
      {showDrawer && (
        <div 
          className={styles.mentorDrawerOverlay}
          onClick={() => setShowDrawer(false)}
        >
          <div 
            className={styles.mentorDrawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-orange)', boxShadow: '0 0 8px var(--accent-orange)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>Schedule Mentor Call</h3>
              </div>
              <button 
                onClick={() => setShowDrawer(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5', marginBottom: '2rem' }}>
              Confirm your details below. A course mentor will reach out to help you work through your questions.
            </p>

            <form 
              onSubmit={handleSubmitCallback} 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div className={styles.profileFormGroup}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Topic Focus</label>
                <input 
                  type="text" 
                  required
                  value={hotlineTopic}
                  onChange={(e) => setHotlineTopic(e.target.value)}
                  className={styles.profileInput}
                  disabled={submittingCallback}
                />
              </div>

              <div className={styles.profileFormGroup}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 98765 43210" 
                  required
                  value={hotlinePhone}
                  onChange={(e) => setHotlinePhone(e.target.value)}
                  className={styles.profileInput}
                  disabled={submittingCallback}
                />
              </div>

              <button 
                type="submit" 
                className={styles.onboardBtn}
                style={{ marginTop: '1.5rem', width: '100%' }}
                disabled={submittingCallback}
              >
                {submittingCallback ? 'Scheduling...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
