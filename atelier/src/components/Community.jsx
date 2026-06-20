'use client';

import React from 'react';
import styles from './Community.module.css';

export default function Community() {
  const bentoItems = [
    {
      id: 1,
      image: '/images/students_classroom.png',
      badge: 'LEARN',
      title: 'Interactive Classrooms',
      description: 'Practical hands-on code sprints and labs led by senior engineers.',
      sizeClass: styles.tallCard
    },
    {
      id: 2,
      image: '/images/campus_speaker.png',
      badge: 'SPEAKER',
      title: 'Campus Talks & Workshops',
      description: 'Inspirational developer keynotes and technical workshops at leading institutions.',
      sizeClass: styles.wideCard
    },
    {
      id: 3,
      image: '/images/mentors_smiling.png',
      badge: 'GROW',
      title: 'Industry Mentors Meet',
      description: 'Direct review, cohort check-ins, and career strategy guidelines.',
      sizeClass: styles.squareCard1
    },
    {
      id: 4,
      image: '/images/group_lawn.png',
      badge: 'NETWORK',
      title: 'Active Peer Network',
      description: 'A close-knit squad of coders collaborating on production SaaS apps.',
      sizeClass: styles.squareCard2
    }
  ];

  return (
    <section id="community" className={styles.communitySection}>
      <div className={`${styles.container} container`}>
        <div className={styles.headerArea}>
          <div className={styles.badgeWrapper}>
            <span className={styles.badge}>COMMUNITY</span>
          </div>
          
          <h2 className={styles.mainTitle}>
            Where Ambitious Developers <br />
            Collaborate, Build & Grow Together.
          </h2>
          <p className={styles.subtitle}>
            Explore some highlights of our past code camps, hackathons, and cohort workshops.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {bentoItems.map((item) => (
            <div key={item.id} className={`${styles.bentoCard} ${item.sizeClass}`}>
              <div className={styles.cardInner}>
                <img src={item.image} alt={item.title} className={styles.cardImage} />
                
                {/* Arrow indicator at top-right of bento card */}
                <div className={styles.arrowIndicator}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>

                {/* Text overlay containing title and descriptions */}
                <div className={styles.cardGradientOverlay}></div>
                <div className={styles.cardOrangeOverlay}></div>

                <div className={styles.cardTextContent}>
                  <span className={styles.cardBadge}>{item.badge}</span>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDescription}>{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
