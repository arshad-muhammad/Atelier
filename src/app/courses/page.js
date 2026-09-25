'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getCourses } from '../actions';
import Navbar from '@/components/Navbar';
import Comparison from '@/components/Comparison';
import Faq from '@/components/Faq';
import TransformCTA from '@/components/TransformCTA';
import Footer from '@/components/Footer';
import styles from './courses-page.module.css';

export default function CoursesPage() {
  const [coursesList, setCoursesList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getCourses();
      setCoursesList(data);
    }
    load();
  }, []);

  const categories = ['All', 'Full-Stack & SaaS', 'System Design', 'AI & GenAI'];

  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      const matchesCategory =
        activeCategory === 'All' ||
        (activeCategory === 'Full-Stack & SaaS' && (course.title.toLowerCase().includes('full-stack') || course.title.toLowerCase().includes('web') || course.title.toLowerCase().includes('saas'))) ||
        (activeCategory === 'System Design' && (course.title.toLowerCase().includes('system design') || course.title.toLowerCase().includes('architectural'))) ||
        (activeCategory === 'AI & GenAI' && (course.title.toLowerCase().includes('ai') || course.title.toLowerCase().includes('genai') || course.title.toLowerCase().includes('agent')));

      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [coursesList, activeCategory, searchQuery]);

  const renderIcon = (type) => {
    switch (type) {
      case 'clock':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'ribbon':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      case 'phone':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case 'calendar':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />

      <main className={styles.pageWrapper}>
        {/* Hero Section (Black Canvas) */}
        <section className={styles.heroSection}>
          <div className={styles.backgroundGrid} />
          <div className={styles.glowEffect} />

          <div className={`${styles.container} container`}>
            {/* Header Area */}
            <div className={styles.headerArea}>
              <div className={styles.badgeWrapper}>
                <span className={styles.badge}>COURSES</span>
              </div>
              
              <h1 className={styles.title}>
                Level Up Your Coding Skills With <br />
                Expert-Led Courses
              </h1>
              
              <p className={styles.subtitle}>
                Explore our live cohorts in full-stack engineering, system design, and applied AI.
              </p>
            </div>
          </div>
        </section>

        {/* Catalog Section (Signature White / Light Sheet Island) */}
        <section 
          id="courses" 
          data-theme="light" 
          className={styles.catalogSection}
        >
          <div className={`${styles.container} container`}>
            {/* Filter Chips & Search Bar */}
            <div className={styles.filterControls}>
              <div className={styles.categoryChips}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`${styles.chipBtn} ${activeCategory === cat ? styles.activeChip : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className={styles.searchBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search programs, stacks, tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn}>
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Courses Grid */}
            {filteredCourses.length > 0 ? (
              <div className={styles.grid}>
                {filteredCourses.map((course) => (
                  <div key={course.id} className={styles.card}>
                    {/* Course Thumbnail Image */}
                    <div className={styles.imageWrapper}>
                      <img 
                        src={course.image || '/images/course_cohort_2.png'} 
                        alt={course.title} 
                        className={styles.image} 
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = '/images/course_cohort_2.png'; }}
                      />
                      <div className={styles.imageOverlay} />
                      
                      {/* Top Badges on Image */}
                      <div className={styles.imageBadgeRow}>
                        <span className={styles.liveBadge}>
                          <span className={styles.liveDot} />
                          Live Cohort
                        </span>
                        {course.duration && (
                          <span className={styles.durationBadge}>
                            {course.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Area */}
                    <div className={styles.cardContent}>
                      {/* Badges List */}
                      {((course.badges && course.badges.length > 0) || course.batchStartDate) && (
                        <div className={styles.badgeList}>
                          {course.batchStartDate && (
                            <span className={styles.cardBadge} style={{ background: 'rgba(242, 85, 34, 0.08)', borderColor: 'rgba(242, 85, 34, 0.3)', color: 'var(--accent-orange)', fontWeight: 700 }}>
                              Starts: {course.batchStartDate}
                            </span>
                          )}
                          {course.badges && course.badges.map((badge, idx) => (
                            <span key={idx} className={styles.cardBadge}>
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Course Title */}
                      <h3 className={styles.courseTitle}>
                        {course.title}
                      </h3>

                      {/* Course Description */}
                      <p className={styles.courseDescription}>
                        {course.description}
                      </p>

                      {/* Key Value Highlights */}
                      <div className={styles.featuresRow}>
                        {course.batchStartDate && (
                          <div className={styles.featurePill} style={{ borderColor: 'rgba(242, 85, 34, 0.25)', color: 'var(--accent-orange)' }}>
                            <div className={styles.featurePillIcon}>{renderIcon('calendar')}</div>
                            <span>Starts {course.batchStartDate}</span>
                          </div>
                        )}
                        <div className={styles.featurePill}>
                          <div className={styles.featurePillIcon}>{renderIcon('clock')}</div>
                          <span>{course.duration || '6-7 Months'}</span>
                        </div>
                        <div className={styles.featurePill}>
                          <div className={styles.featurePillIcon}>{renderIcon('ribbon')}</div>
                          <span>Certified</span>
                        </div>
                        <div className={styles.featurePill}>
                          <div className={styles.featurePillIcon}>{renderIcon('phone')}</div>
                          <span>24/7 Support</span>
                        </div>
                      </div>

                      {/* Price Row */}
                      <div className={styles.priceRow}>
                        <div className={styles.priceContainer}>
                          <span className={styles.priceLabel}>Price</span>
                          <div className={styles.priceValues}>
                            <span className={styles.priceValue}>{course.price || 'Free'}</span>
                            {course.originalPrice && (
                              <span className={styles.originalPrice}>{course.originalPrice}</span>
                            )}
                          </div>
                        </div>
                        {course.discount && (
                          <span className={styles.discountBadge}>{course.discount}</span>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                        <button className={styles.button}>
                          <span>Check Course</span>
                          <div className={styles.buttonArrow}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </div>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>No courses match your current search or category filter.</p>
                <button 
                  onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                  className={styles.resetFilterBtn}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Comparison Section */}
        <Comparison />

        {/* FAQ Section */}
        <Faq />

        {/* Transform CTA Banner */}
        <TransformCTA />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
