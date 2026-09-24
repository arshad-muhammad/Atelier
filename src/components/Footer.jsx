'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Background auditorium image & moody dark overlay */}
      <div className={styles.bgImageWrap}>
        <img
          src="/images/footer_auditorium.jpg"
          alt="Auditorium Background"
          className={styles.bgImage}
        />
        <div className={styles.bgOverlay} />
      </div>

      <div className={`${styles.container} container`}>
        <div className={styles.topGrid}>
          {/* Brand & Social Column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logoLink} aria-label="Atelier Home">
              <img src="/logo.png" alt="Atelier Logo" className={styles.logoImg} />
            </Link>

            <div className={styles.socialRow}>
              {/* Instagram */}
              <a
                href="https://instagram.com/spherehive"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/spherehive"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Discord"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <path d="M19.78 6.11A20.47 20.47 0 0 0 15 4.5l-.21.45A17.9 17.9 0 0 0 9.21 5L9 4.5a20.47 20.47 0 0 0-4.78 1.61A21 21 0 0 0 2 17.5a20.89 20.89 0 0 0 5.22 2.5l1-1.32a13 13 0 0 1-3.22-1.68l.21-.18A17.65 17.65 0 0 0 18.79 17l.21.18a13 13 0 0 1-3.22 1.68l1 1.32A20.89 20.89 0 0 0 22 17.5a21 21 0 0 0-2.22-11.39z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </a>
            </div>
          </div>

          {/* ABOUT Column */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>ABOUT</h4>
            <ul className={styles.linksList}>
              <li><Link href="/about" className={styles.footerLink}>About Us</Link></li>
              <li><Link href="/request-callback" className={styles.footerLink}>Request Callback</Link></li>
              <li><Link href="/contact" className={styles.footerLink}>Contact & Support</Link></li>
              <li><Link href="/terms" className={styles.footerLink}>Terms and Condition</Link></li>
              <li><Link href="/privacy-policy" className={styles.footerLink}>Privacy Policy</Link></li>
            </ul>
          </div>

          {/* COMPANY Column */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>COMPANY</h4>
            <ul className={styles.linksList}>
              <li><Link href="/resume-checker" className={styles.footerLink}>Resume Checker</Link></li>
              <li><Link href="/join-faculty" className={styles.footerLink}>Join Faculty & Mentors</Link></li>
              <li><Link href="/courses" className={styles.footerLink}>All Cohorts</Link></li>
              <li><Link href="/contact" className={styles.footerLink}>Hire From Us</Link></li>
              <li><a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Discord</a></li>
              <li><Link href="/refund-policy" className={styles.footerLink}>Pricing and Refund</Link></li>
            </ul>
          </div>

          {/* CONTACT Column */}
          <div className={`${styles.linksCol} ${styles.contactCol}`}>
            <h4 className={styles.colTitle}>CONTACT</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactSchedule}>Online: 11am - 8pm</span>
                <span className={styles.contactPhone}>+91 7411288457</span>
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactSchedule}>Offline: 11am - 8pm</span>
                <span className={styles.contactPhone}>+91 7411288457</span>
              </div>

              <div className={styles.contactEmailRow}>
                <a href="mailto:spherehive@kvgce.ac.in" className={styles.contactEmail}>
                  spherehive@kvgce.ac.in
                </a>
              </div>

              <p className={styles.contactAddress}>
                Top Floor, MBA Block<br />
                KVGCE Campus, Kurunjibhag<br />
                Sullia(DK), Karnataka, 574327
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Giant Bottom Typography: ATELIER */}
      <div className={styles.giantBrandTextWrap}>
        <div className={styles.giantBrandTrack}>
          {'ATELIER'.split('').map((char, index) => (
            <span key={index} className={styles.giantBrandChar}>
              {char}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
