'use client';

import React from 'react';
import styles from './Comparison.module.css';

export default function Comparison() {
  const atelierFeatures = [
    'Highly Affordable, No Quality Cuts',
    'Project-Based, Skill-First Learning',
    'Continuously Updated With Industry Trends',
    'Internal Hackathons, Challenges & Face-Offs',
    'Industry-Relevant, Job-Oriented Curriculum'
  ];

  const otherFeatures = [
    'High Fees With Compromised Quality',
    'Theory-Centric Learning',
    'Outdated, Static Curriculum',
    'No Competitive Learning Environment',
    'Limited Practical Exposure'
  ];

  return (
    <section id="comparison" className={styles.comparisonSection}>
      <div className={`${styles.container} container`}>
        <div className={styles.headerArea}>
          <div className={styles.badgeWrapper}>
            <span className={styles.badge}>ATELIER VS OTHERS</span>
          </div>
          <h2 className={styles.mainTitle}>
            Why Modern Developers Choose Atelier
          </h2>
          <p className={styles.subtitle}>
            A side-by-side breakdown of how we stack up against traditional bootcamps and outdated coaching classes.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Atelier Column (Positive / Glowing) */}
          <div className={styles.atelierCard}>
            <div className={styles.cardHeader}>
              <div className={styles.logoPill}>Atelier</div>
              <h3 className={styles.cardTitle}>The Atelier Standard</h3>
            </div>
            
            <div className={styles.featuresList}>
              {atelierFeatures.map((feat, idx) => (
                <div key={idx} className={styles.featureRow}>
                  <div className={styles.checkIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className={styles.featureText}>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Others Column (Muted / Crossed) */}
          <div className={styles.othersCard}>
            <div className={styles.cardHeader}>
              <div className={styles.othersPill}>Others</div>
              <h3 className={styles.cardTitle}>Traditional Bootcamps</h3>
            </div>
            
            <div className={styles.featuresList}>
              {otherFeatures.map((feat, idx) => (
                <div key={idx} className={styles.featureRowMuted}>
                  <div className={styles.crossIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                  <span className={styles.featureTextMuted}>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
