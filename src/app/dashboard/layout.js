'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStudentProfileByEmail, getCourses, recordStudentDailyStreak } from '../actions';
import InitialsAvatar from '@/components/InitialsAvatar';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  const [activeCourseId, setActiveCourseId] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [userName, setUserName] = useState('Student');
  const [userAvatar, setUserAvatar] = useState(null);
  const [streak, setStreak] = useState(1);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [dbCourses, setDbCourses] = useState([]);

  // Client mounting & Auth gating states
  const [isMounted, setIsMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync active course and username profile states
  useEffect(() => {
    setIsMounted(true);
    setMobileNavOpen(false);

    const email = localStorage.getItem('loggedInStudentEmail');
    if (!email) {
      router.push('/auth/signin?redirectTo=' + encodeURIComponent(pathname));
      return;
    }

    // Set checkingAuth to false since local storage session exists (fast render path)
    setCheckingAuth(false);

    // Hydrate states from localStorage cache for immediate UI rendering
    const cachedProfile = localStorage.getItem('studentProfile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setUserName(parsed.name || 'Student');
        setUserAvatar(parsed.avatar || null);
        setStreak(parsed.streak || 1);
        setEnrolledCourses(parsed.enrolledCourses || []);
      } catch (e) {}
    }

    const syncCourse = (enrolled = null) => {
      const saved = localStorage.getItem('activeCourseId');
      let targetId = saved ? parseInt(saved, 10) : null;
      const list = enrolled || enrolledCourses;
      if (list && list.length > 0) {
        if (!targetId || !list.includes(targetId)) {
          targetId = list[0];
          localStorage.setItem('activeCourseId', targetId.toString());
        }
      }
      if (targetId && !isNaN(targetId)) {
        setActiveCourseId(targetId);
      }
    };

    const syncProfile = async () => {
      const currentEmail = localStorage.getItem('loggedInStudentEmail');
      if (!currentEmail) {
        router.push('/auth/signin');
        return;
      }
      try {
        // Record and calculate real daily streak based on active calendar days
        const streakRes = await recordStudentDailyStreak(currentEmail);
        if (streakRes && streakRes.streak) {
          setStreak(streakRes.streak);
        }

        const student = await getStudentProfileByEmail(currentEmail);

        if (student) {
          setUserName(student.name);
          setUserAvatar(student.avatar || null);
          setStreak(student.streak || streakRes.streak || 1);
          const studentEnrolled = student.enrolledCourses || [];
          setEnrolledCourses(studentEnrolled);
          syncCourse(studentEnrolled);
          // Sync cache
          localStorage.setItem('studentProfile', JSON.stringify({
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            college: student.college || '',
            degree: student.degree || '',
            gradYear: student.gradYear || '',
            bio: student.bio || '',
            github: student.github || '',
            linkedin: student.linkedin || '',
            portfolio: student.portfolio || '',
            avatar: student.avatar || null,
            skills: student.skills || [],
            streak: student.streak || streakRes.streak || 1,
            enrolledCourses: studentEnrolled
          }));
        } else {
          localStorage.removeItem('loggedInStudentEmail');
          localStorage.removeItem('studentProfile');
          router.push('/auth/signin');
        }
      } catch (err) {
        console.error("Profile sync failed:", err);
      }
    };

    const syncCoursesList = async () => {
      try {
        const coursesList = await getCourses();
        setDbCourses(coursesList);
      } catch (err) {
        console.error("Courses list sync failed:", err);
      }
    };

    syncCourse();
    syncProfile();
    syncCoursesList();

    const onCourseChange = () => {
      syncCourse();
      syncProfile();
      syncCoursesList();
    };

    const onProfileChange = () => {
      syncProfile();
      syncCoursesList();
    };

    window.addEventListener('courseChanged', onCourseChange);
    window.addEventListener('profileChanged', onProfileChange);

    return () => {
      window.removeEventListener('courseChanged', onCourseChange);
      window.removeEventListener('profileChanged', onProfileChange);
    };
  }, []);

  // Map database courses to selector layout format with full defensive guards
  // NOTE: These derivations and the useEffect below MUST be placed before any early return
  // to satisfy the Rules of Hooks (hooks must always be called in the same order every render).
  const enrolledIds = Array.isArray(enrolledCourses) ? enrolledCourses.map(Number) : [];
  const courses = (Array.isArray(dbCourses) ? dbCourses : [])
    .filter((c) => c && enrolledIds.includes(Number(c.id)))
    .map((c) => {
      const rawTitle = typeof c.title === 'string' ? c.title : (c.title ? String(c.title) : `Cohort #${c.id}`);
      const rawDesc = typeof c.description === 'string' ? c.description : (c.description ? String(c.description) : 'Curriculum overview and track.');
      return {
        id: c.id,
        name: rawTitle.includes(':') ? rawTitle.split(':')[0].trim() : rawTitle,
        desc: rawDesc.length > 60 ? rawDesc.slice(0, 60) + '...' : rawDesc
      };
    });

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0] || null;

  // Keep activeCourseId synchronized if activeCourse falls back to courses[0]
  useEffect(() => {
    if (activeCourse && activeCourse.id && activeCourse.id !== activeCourseId) {
      setActiveCourseId(activeCourse.id);
      localStorage.setItem('activeCourseId', activeCourse.id.toString());
    }
  }, [activeCourse, activeCourseId]);

  // Auth check loading state
  if (!isMounted || checkingAuth) {
    return (
      <div className={styles.authLoaderWrapper} data-lenis-prevent>
        <div className={styles.authLoaderCard}>
          <div className={styles.authSpinner} />
          <h2 className={styles.authLoaderTitle}>Loading Dashboard</h2>
          <p className={styles.authLoaderText}>Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  const handleCourseChange = (id) => {
    setActiveCourseId(id);
    localStorage.setItem('activeCourseId', id.toString());
    window.dispatchEvent(new Event('courseChanged'));
  };

  // If we are on the onboarding page, render a clean wrapper without sidebar/navigation
  if (pathname === '/dashboard/onboarding') {
    return <div className="onboard-shell">{children}</div>;
  }

  const navItems = [
    {
      label: 'Workbench',
      href: '/dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    },
    {
      label: 'My Courses',
      href: '/dashboard/my-courses',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      label: 'Explore Catalog',
      href: '/dashboard/explore',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    },
    {
      label: 'Live Classes',
      href: '/dashboard/live',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z" />
        </svg>
      )
    },
    {
      label: 'Materials',
      href: '/dashboard/materials',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      label: 'Assessments',
      href: '/dashboard/assessments',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    {
      label: 'Resume Checker',
      href: '/resume-checker',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    }
  ];

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Learning Workbench';
      case '/dashboard/my-courses':
        return 'Purchased Courses';
      case '/dashboard/explore':
        return 'Course Catalog';
      case '/dashboard/live':
        return 'Live Cohort Classes';
      case '/dashboard/materials':
        return 'Reference Materials';
      case '/dashboard/assessments':
        return 'Course Assessments & Tests';
      case '/dashboard/profile':
        return 'Student Profile';
      case '/resume-checker':
      case '/dashboard/resume-checker':
        return 'ATS Resume Checker';
      default:
        return 'Atelier Portal';
    }
  };

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div 
          className={styles.mobileBackdrop} 
          onClick={() => setMobileNavOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${mobileNavOpen ? styles.sidebarMobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <img src="/logo.png" alt="Atelier Logo" className={styles.logoImg} />
          <div className={styles.logoText}>
            <span className={styles.brandName}>Atelier</span>
            <span className={styles.brandSub}>Workspace</span>
          </div>
          <button 
            type="button"
            className={styles.mobileCloseBtn} 
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                title={collapsed ? item.label : ''}
                onClick={() => setMobileNavOpen(false)}
              >
                <div className={styles.navIcon}>{item.icon}</div>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard/profile" className={styles.footerUserRow} onClick={() => setMobileNavOpen(false)}>
            {userAvatar ? (
              <img src={userAvatar} alt="Student Profile" className={styles.avatar} />
            ) : (
              <InitialsAvatar name={userName} size={36} />
            )}
            <div className={styles.userInfo}>
              <span className={styles.username}>{userName}</span>
              <span className={styles.userRole}>Premium Cohort</span>
            </div>
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className={styles.contentArea} data-lenis-prevent>
        {/* Background Grid & Orange Glow Layers */}
        <div className={styles.bgGrid} />
        <div className={styles.glow} />

        <header className={styles.topHeader}>
          <div className={styles.headerPrimaryRow}>
            {/* Mobile hamburger button */}
            <button 
              type="button"
              className={styles.mobileMenuToggle}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
            >
              {mobileNavOpen ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            <h1 className={styles.pageTitle}>
              {getPageTitle()}
            </h1>

            {/* Compact metric on mobile row */}
            <div className={styles.mobileHeaderMetric}>
              <div className={`${styles.metricItem} ${styles.metricFlame}`} title="Active daily streak">
                <svg className={styles.metricIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                <span>{streak}d</span>
              </div>
            </div>
          </div>

          <div className={styles.headerControlsRow}>
            {pathname !== '/dashboard/my-courses' && (
              <div className={styles.customDropdownWrapper} ref={dropdownRef}>
                {courses.length > 0 ? (
                  <button 
                    type="button"
                    className={styles.dropdownToggle}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                  >
                    <span className={styles.dropdownActiveDot} />
                    <div className={styles.dropdownToggleText}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className={styles.dropdownLabel}>Active Workspace</span>
                        {courses.length > 1 && (
                          <span style={{ fontSize: '0.62rem', background: 'rgba(242, 85, 34, 0.15)', color: 'var(--accent-orange)', border: '1px solid rgba(242, 85, 34, 0.3)', borderRadius: '4px', padding: '1px 5px', fontWeight: '800' }}>
                            {courses.length} Tracks
                          </span>
                        )}
                      </div>
                      <span className={styles.dropdownValue}>{activeCourse ? activeCourse.name : 'Select Cohort'}</span>
                    </div>
                    <svg 
                      className={`${styles.dropdownChevron} ${dropdownOpen ? styles.dropdownChevronOpen : ''}`} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                ) : (
                  <Link 
                    href="/dashboard/explore"
                    className={styles.dropdownToggle}
                    style={{ textDecoration: 'none' }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                    <div className={styles.dropdownToggleText}>
                      <span className={styles.dropdownLabel}>No Active Enrollment</span>
                      <span className={styles.dropdownValue} style={{ color: 'var(--accent-orange)' }}>Browse Catalog →</span>
                    </div>
                  </Link>
                )}

                {dropdownOpen && courses.length > 0 && (
                  <div className={styles.dropdownMenu} role="listbox">
                    <div className={styles.dropdownMenuHeader}>Switch Cohort Workspace</div>
                    {courses.map((c) => {
                      const isSelected = c.id === activeCourseId;
                      return (
                        <div 
                          key={c.id} 
                          className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemActive : ''}`}
                          onClick={() => {
                            handleCourseChange(c.id);
                            setDropdownOpen(false);
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={styles.dropdownItemInfo}>
                            <span className={styles.dropdownItemName}>{c.name}</span>
                            <span className={styles.dropdownItemDesc}>{c.desc}</span>
                          </div>
                          {isSelected && (
                            <span className={styles.dropdownCheck}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent-orange)" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className={styles.desktopHeaderMetrics}>
              <div className={`${styles.metricItem} ${styles.metricFlame}`} title="Active daily streak">
                <svg className={styles.metricIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                <span>{streak} Day Streak</span>
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
