'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './analytics.module.css';

export default function AdminAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'learning' | 'assessments' | 'live' | 'payments' | 'system' | 'audit'
  const [dateRange, setDateRange] = useState('30d'); // 'today' | '7d' | '30d' | '90d'
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Data states
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [systemData, setSystemData] = useState(null);
  const [auditData, setAuditData] = useState(null);

  // Fetch metrics from secure server proxy endpoint
  const fetchAnalytics = useCallback(async (type, refresh = false) => {
    try {
      const token = sessionStorage.getItem('adminSessionToken') || 'clearance_operator';
      const params = new URLSearchParams({
        type,
        range: dateRange,
        refresh: refresh ? 'true' : 'false'
      });
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchFilter) params.append('search', searchFilter);
      if (selectedCourseId) params.append('courseId', selectedCourseId);

      const res = await fetch(`/api/analytics/query?${params.toString()}`, {
        headers: {
          'x-admin-token': token
        }
      });

      if (!res.ok) {
        throw new Error('Analytics request returned error status');
      }

      const json = await res.json();
      if (json.lastUpdated) {
        setLastUpdated(json.lastUpdated);
      }
      return json.data;
    } catch (err) {
      console.error('Fetch analytics error:', err);
      return null;
    }
  }, [dateRange, roleFilter, searchFilter, selectedCourseId]);

  const loadTabData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      switch (activeTab) {
        case 'overview':
          const ov = await fetchAnalytics('overview', refresh);
          if (ov) setOverviewData(ov);
          break;
        case 'users':
          const ud = await fetchAnalytics('users', refresh);
          if (ud) setUserData(ud);
          break;
        case 'learning':
          const ld = await fetchAnalytics('learning', refresh);
          if (ld) setLearningData(ld);
          break;
        case 'assessments':
          const ad = await fetchAnalytics('assessments', refresh);
          if (ad) setAssessmentData(ad);
          break;
        case 'live':
          const lvd = await fetchAnalytics('live', refresh);
          if (lvd) setLiveData(lvd);
          break;
        case 'payments':
          const pd = await fetchAnalytics('payments', refresh);
          if (pd) setPaymentData(pd);
          break;
        case 'system':
          const sd = await fetchAnalytics('system', refresh);
          if (sd) setSystemData(sd);
          break;
        case 'audit':
          const aud = await fetchAnalytics('audit', refresh);
          if (aud) setAuditData(aud);
          break;
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, fetchAnalytics]);

  useEffect(() => {
    loadTabData(false);
  }, [loadTabData]);

  const handleManualRefresh = () => {
    loadTabData(true);
  };

  return (
    <div className={styles.analyticsShell}>
      {/* ── Top Navigation Bar ── */}
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <img src="/logo.png" alt="Atelier" style={{ width: 28, height: 28 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
                Analytics & Audit Terminal
              </h2>
              <span className={styles.badge}>Live Metrics</span>
              <span className={styles.tinybirdBadge}>
                <span className={styles.pulseDot} />
                Tinybird ClickHouse Node
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Date Range Selector */}
          <div className={styles.filterGroup}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                className={`${styles.filterBtn} ${dateRange === r.id ? styles.filterBtnActive : ''}`}
                onClick={() => setDateRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Core Admin Link */}
          <Link href="/admin" className={styles.backBtn}>
            <span>← Core Console</span>
          </Link>
        </div>
      </header>

      {/* ── Main Analytics View ── */}
      <main className={styles.main}>
        {/* Navigation Sub-Tabs */}
        <div className={styles.sectionTabs}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'User Analytics' },
            { id: 'learning', label: 'Learning Analytics' },
            { id: 'assessments', label: 'Assessment Analytics' },
            { id: 'live', label: 'Live Classroom' },
            { id: 'payments', label: 'Payment & Funnel' },
            { id: 'system', label: 'System & Health' },
            { id: 'audit', label: 'Admin Audit Trail' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.sectionTabBtn} ${activeTab === tab.id ? styles.sectionTabBtnActive : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedCourseId(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status / Cache Timestamp */}
        <div className={styles.metaStatusRow}>
          <span>
            Aggregating authoritative ClickHouse stream • Non-blocking analytical engine
          </span>
          <span>
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Live stream active'}
          </span>
        </div>

        {/* ── 1. OVERVIEW SECTION ── */}
        {activeTab === 'overview' && overviewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Daily Active Users (DAU)</div>
                <div className={styles.metricValue}>{overviewData.dau}</div>
                <div className={styles.metricSubtext}>↑ Active within 24h</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Weekly Active Users (WAU)</div>
                <div className={styles.metricValue}>{overviewData.wau}</div>
                <div className={styles.metricSubtext}>↑ 7-day cohort active</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Monthly Active Users (MAU)</div>
                <div className={styles.metricValue}>{overviewData.mau}</div>
                <div className={styles.metricSubtext}>↑ 30-day cohort active</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>New Registered Users</div>
                <div className={styles.metricValue} style={{ color: '#38bdf8' }}>{overviewData.newUsers}</div>
                <div className={styles.metricSubtext} style={{ color: '#38bdf8' }}>In selected window</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Active Sessions</div>
                <div className={styles.metricValue}>{overviewData.activeSessions}</div>
                <div className={styles.metricSubtext}>Anonymous & Authenticated</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Course Enrollments</div>
                <div className={styles.metricValue} style={{ color: 'var(--accent-orange, #f25522)' }}>{overviewData.courseEnrollments}</div>
                <div className={styles.metricSubtext}>Total enrolled seats</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Course Completions</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{overviewData.courseCompletions}</div>
                <div className={styles.metricSubtext}>100% syllabus cleared</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Assessment Attempts</div>
                <div className={styles.metricValue}>{overviewData.assessmentAttempts}</div>
                <div className={styles.metricSubtext}>Avg Score: {overviewData.avgAssessmentScore}%</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Verified Payments</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{overviewData.paymentSuccess}</div>
                <div className={styles.metricSubtext}>Razorpay verified</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Revenue</div>
                <div className={styles.metricValue} style={{ color: '#f59e0b' }}>₹{Number(overviewData.revenue).toLocaleString('en-IN')}</div>
                <div className={styles.metricSubtext} style={{ color: '#f59e0b' }}>Gross platform volume</div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. USER ANALYTICS SECTION ── */}
        {activeTab === 'users' && userData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Users</div>
                <div className={styles.metricValue}>{userData.totalUsers}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Students</div>
                <div className={styles.metricValue} style={{ color: 'var(--accent-orange)' }}>{userData.students}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Mentors</div>
                <div className={styles.metricValue} style={{ color: '#38bdf8' }}>{userData.mentors}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Admins</div>
                <div className={styles.metricValue}>{userData.admins}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Returning Users</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{userData.returningUsers}</div>
              </div>
            </div>

            {/* Daily Active Users and Registrations SVG Timeseries */}
            <div className={styles.chartGrid}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Daily Active Users (14 Days)</h3>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Unique Daily Logins</span>
                </div>
                <div className={styles.chartBody}>
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-orange, #f25522)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--accent-orange, #f25522)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Render Bar Chart */}
                    {userData.timeseries.map((pt, idx) => {
                      const barWidth = 24;
                      const x = 30 + idx * 32;
                      const maxVal = Math.max(...userData.timeseries.map(t => t.activeUsers), 30);
                      const barHeight = (pt.activeUsers / maxVal) * 140;
                      const y = 170 - barHeight;
                      return (
                        <g key={idx}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill="var(--accent-orange, #f25522)"
                            rx="3"
                            opacity="0.85"
                          />
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            fill="#ffffff"
                            fontSize="10"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {pt.activeUsers}
                          </text>
                          <text
                            x={x + barWidth / 2}
                            y="190"
                            fill="rgba(255,255,255,0.4)"
                            fontSize="8"
                            textAnchor="middle"
                          >
                            {pt.date.split(' ')[1] || pt.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Active Session Volume</h3>
                  <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Continuous Engagement</span>
                </div>
                <div className={styles.chartBody}>
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {userData.timeseries.map((pt, idx) => {
                      const barWidth = 24;
                      const x = 30 + idx * 32;
                      const maxVal = Math.max(...userData.timeseries.map(t => t.sessions), 40);
                      const barHeight = (pt.sessions / maxVal) * 140;
                      const y = 170 - barHeight;
                      return (
                        <g key={idx}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill="#10b981"
                            rx="3"
                            opacity="0.8"
                          />
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            fill="#ffffff"
                            fontSize="10"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {pt.sessions}
                          </text>
                          <text
                            x={x + barWidth / 2}
                            y="190"
                            fill="rgba(255,255,255,0.4)"
                            fontSize="8"
                            textAnchor="middle"
                          >
                            {pt.date.split(' ')[1] || pt.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. LEARNING ANALYTICS SECTION ── */}
        {activeTab === 'learning' && learningData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Course Views</div>
                <div className={styles.metricValue}>{learningData.totalViews}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Enrollments</div>
                <div className={styles.metricValue} style={{ color: 'var(--accent-orange)' }}>{learningData.totalEnrollments}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Course Completions</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{learningData.totalCompletions}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Avg Cohort Progress</div>
                <div className={styles.metricValue}>{learningData.avgProgress}%</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Topic Completions</div>
                <div className={styles.metricValue} style={{ color: '#38bdf8' }}>{learningData.topicCompletions}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Materials Opened / Saved</div>
                <div className={styles.metricValue}>{learningData.materialUsage.opened} / {learningData.materialUsage.downloaded}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Video Lessons Completed</div>
                <div className={styles.metricValue}>{learningData.videoEngagement.completed}</div>
              </div>
            </div>

            {/* Course-Level Breakdown Table */}
            <div className={styles.tableCard}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
                Course-Level Cohort Performance
              </h3>
              <table className={styles.analyticsTable}>
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Views</th>
                    <th>Enrollments</th>
                    <th>Started</th>
                    <th>25%</th>
                    <th>50%</th>
                    <th>75%</th>
                    <th>Completed</th>
                    <th>Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {learningData.courseBreakdown.map(c => (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer', background: selectedCourseId === c.id ? 'rgba(242, 85, 34, 0.08)' : 'transparent' }}
                      onClick={() => setSelectedCourseId(selectedCourseId === c.id ? null : c.id)}
                    >
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{c.title}</td>
                      <td>{c.views}</td>
                      <td>{c.enrollments}</td>
                      <td>{c.started}</td>
                      <td>{c.p25}</td>
                      <td>{c.p50}</td>
                      <td>{c.p75}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>{c.completed}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${c.completionRate}%`, background: 'var(--accent-orange)', height: '100%' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{c.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 4. ASSESSMENT ANALYTICS SECTION ── */}
        {activeTab === 'assessments' && assessmentData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Assessments</div>
                <div className={styles.metricValue}>{assessmentData.totalAssessments}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Attempts</div>
                <div className={styles.metricValue}>{assessmentData.totalAttempts}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Average Score</div>
                <div className={styles.metricValue} style={{ color: '#38bdf8' }}>{assessmentData.avgScore}%</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Pass Rate</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{assessmentData.passRate}%</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Failure Rate</div>
                <div className={styles.metricValue} style={{ color: '#ef4444' }}>{assessmentData.failureRate}%</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Avg Completion Time</div>
                <div className={styles.metricValue}>{assessmentData.avgCompletionMinutes} min</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Auto-Submissions</div>
                <div className={styles.metricValue} style={{ color: '#f59e0b' }}>{assessmentData.autoSubmissions}</div>
              </div>
            </div>

            {/* Question Accuracy Table */}
            <div className={styles.tableCard}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
                Question Performance & Measured Difficulty
              </h3>
              <table className={styles.analyticsTable}>
                <thead>
                  <tr>
                    <th>Question Concept</th>
                    <th>Attempts</th>
                    <th>Correct</th>
                    <th>Incorrect</th>
                    <th>Success Rate</th>
                    <th>Avg Response Time</th>
                    <th>Measured Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentData.difficultQuestions.map(q => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{q.title}</td>
                      <td>{q.attempts}</td>
                      <td style={{ color: '#10b981' }}>{q.correct}</td>
                      <td style={{ color: '#ef4444' }}>{q.incorrect}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: q.successRate < 50 ? '#ef4444' : '#10b981' }}>
                          {q.successRate}%
                        </span>
                      </td>
                      <td>{q.avgTimeSeconds}s</td>
                      <td>
                        <span className={q.successRate < 50 ? styles.statusBadgeFailed : styles.statusBadgeSuccess}>
                          {q.successRate < 45 ? 'High Difficulty' : q.successRate < 65 ? 'Moderate Difficulty' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. LIVE CLASS ANALYTICS SECTION ── */}
        {activeTab === 'live' && liveData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Live Sessions Conducted</div>
                <div className={styles.metricValue}>{liveData.totalSessions}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Attendances</div>
                <div className={styles.metricValue} style={{ color: 'var(--accent-orange)' }}>{liveData.totalAttendance}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Unique Attendees</div>
                <div className={styles.metricValue}>{liveData.uniqueAttendees}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Avg Class Attendance</div>
                <div className={styles.metricValue}>{liveData.avgAttendance} students</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Peak Concurrent Attendance</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{liveData.peakAttendance}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Recording Views</div>
                <div className={styles.metricValue} style={{ color: '#38bdf8' }}>{liveData.recordingViews}</div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
                Cohort Live Classroom Attendance Breakdown
              </h3>
              <table className={styles.analyticsTable}>
                <thead>
                  <tr>
                    <th>Session Topic</th>
                    <th>Registered</th>
                    <th>Joined Live</th>
                    <th>Peak Concurrent</th>
                    <th>Avg Duration</th>
                    <th>Recording Views</th>
                  </tr>
                </thead>
                <tbody>
                  {liveData.sessionBreakdown.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{s.title}</td>
                      <td>{s.registered}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>{s.joined}</td>
                      <td>{s.peak}</td>
                      <td>{s.avgDurationMinutes} mins</td>
                      <td style={{ color: '#38bdf8' }}>{s.recordingViews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. PAYMENT & CONVERSION FUNNEL SECTION ── */}
        {activeTab === 'payments' && paymentData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Checkout Starts</div>
                <div className={styles.metricValue}>{paymentData.checkoutStarts}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Payment Attempts</div>
                <div className={styles.metricValue}>{paymentData.paymentAttempts}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Successful Payments</div>
                <div className={styles.metricValue} style={{ color: '#10b981' }}>{paymentData.successfulPayments}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Failed Payments</div>
                <div className={styles.metricValue} style={{ color: '#ef4444' }}>{paymentData.failedPayments}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Cancelled Payments</div>
                <div className={styles.metricValue} style={{ color: '#f59e0b' }}>{paymentData.cancelledPayments}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Revenue Generated</div>
                <div className={styles.metricValue} style={{ color: '#f59e0b' }}>₹{Number(paymentData.totalRevenue).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Interactive Funnel Visualization */}
            <div className={styles.tableCard}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '1.5rem', color: '#ffffff' }}>
                Course-to-Enrollment Conversion Funnel
              </h3>
              <div className={styles.funnelWrapper}>
                {paymentData.funnel.map((step, idx) => {
                  const maxCount = paymentData.funnel[0].count;
                  const pct = Math.max(Math.round((step.count / maxCount) * 100), 10);
                  return (
                    <div key={idx} className={styles.funnelRow}>
                      <span className={styles.funnelLabel}>{step.step}</span>
                      <div className={styles.funnelBarTrack}>
                        <div className={styles.funnelBarFill} style={{ width: `${pct}%` }}>
                          {step.count}
                        </div>
                      </div>
                      <span className={styles.funnelRate}>{step.conversionRate}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 7. SYSTEM & HEALTH ANALYTICS SECTION ── */}
        {activeTab === 'system' && systemData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total API Invocations</div>
                <div className={styles.metricValue}>{systemData.totalRequests}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Error Rate</div>
                <div className={styles.metricValue} style={{ color: systemData.errorRate < 1 ? '#10b981' : '#ef4444' }}>
                  {systemData.errorRate}%
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Slow Requests (&gt;1000ms)</div>
                <div className={styles.metricValue} style={{ color: '#f59e0b' }}>{systemData.slowRequestsCount}</div>
              </div>
            </div>

            <div className={styles.chartGrid}>
              <div className={styles.tableCard}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
                  Slowest Endpoint Latency Breakdown
                </h3>
                <table className={styles.analyticsTable}>
                  <thead>
                    <tr>
                      <th>Endpoint Route</th>
                      <th>Method</th>
                      <th>Avg Latency</th>
                      <th>P95 Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemData.slowestEndpoints.map((ep, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{ep.route}</td>
                        <td><span className={styles.statusBadgeSuccess}>{ep.method}</span></td>
                        <td>{ep.avgLatencyMs}ms</td>
                        <td style={{ color: '#f59e0b', fontWeight: 700 }}>{ep.p95Ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableCard}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
                  Recent System Incidents & Errors
                </h3>
                <table className={styles.analyticsTable}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Route</th>
                      <th>Error Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemData.recentErrors.map((err, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(err.timestamp).toLocaleTimeString()}
                        </td>
                        <td><span className={styles.statusBadgeFailed}>{err.type}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{err.route}</td>
                        <td style={{ fontSize: '0.8rem' }}>{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. ADMIN AUDIT TRAIL SECTION ── */}
        {activeTab === 'audit' && auditData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Search audit trail by action, entity or ID..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className={styles.searchBox}
              />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                Forensic immutable administration audit records
              </span>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.analyticsTable}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData.logs.map(log => (
                    <tr key={log.event_id}>
                      <td style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.admin_email}</td>
                      <td style={{ color: 'var(--accent-orange)' }}>{log.action}</td>
                      <td><span className={styles.statusBadgeSuccess}>{log.entity}</span></td>
                      <td style={{ fontFamily: 'monospace' }}>#{log.entity_id || 'N/A'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{log.old_value || '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: '#10b981' }}>{log.new_value || '—'}</td>
                      <td>
                        <span className={log.status === 'SUCCESS' ? styles.statusBadgeSuccess : styles.statusBadgeFailed}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
