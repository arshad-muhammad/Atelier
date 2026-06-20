'use client';

import React from 'react';
import styles from './StatsGrid.module.css';

export default function StatsGrid() {
  return (
    <section className={styles.statsSection}>
      <div className={`${styles.container} container`}>
        <div className={styles.grid}>
          {/* Card 1 - Community Guild */}
          <div className={`${styles.card} ${styles.communityCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconContainer}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className={styles.statCount}>Guild</span>
            </div>
            <h3 className={styles.statTitle}>Active Developers</h3>
            <p className={styles.statDescription}>Be part of a vibrant learning ecosystem.</p>
          </div>

          {/* Card 2 - Events & Sprints */}
          <div className={`${styles.card} ${styles.learnersCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconContainer}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <span className={styles.statCount}>Sprint</span>
            </div>
            <h3 className={styles.statTitle}>Community Events</h3>
            <p className={styles.statDescription}>Join a large and growing community of coders.</p>
          </div>

          {/* Card 3 - Unlock */}
          <div className={`${styles.card} ${styles.unlockCard}`}>
            <h2 className={styles.unlockTitle}>
              UNLOCK 
              <span className={styles.unlockAvatarGroup}>
                <img src="/images/avatar1.jpg" alt="Student" />
                <img src="/images/avatar2.jpg" alt="Student" />
                <img src="/images/avatar3.jpg" alt="Student" />
                <img src="/images/avatar4.jpg" alt="Student" />
              </span>
              YOUR
            </h2>
            <h2 className={styles.unlockTitle}>FIRST JOB AND INTERNSHIP WITH US!</h2>
            
            <div className={styles.toggleContainer}>
              <div className={styles.toggleButton}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Card 4 - Start Learning */}
          <div className={`${styles.card} ${styles.startLearningCard}`}>
            <div className={styles.startLearningHeader}>
              <span className={styles.startLearningLabel}>Start Learning</span>
            </div>
            
            <div className={styles.imageContainer}>
              <img src="/images/group_students.png" alt="Students Group" className={styles.groupImage} />
            </div>

            <button className={styles.getInTouchBtn}>
              Get in touch
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
