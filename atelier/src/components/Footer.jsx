'use client';

import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Giant Outline Brand Header */}
      <div className={styles.giantOutlineText}>
        Atelier
      </div>

      <div className={`${styles.container} container`}>
        <div className={styles.columnsGrid}>
          {/* Brand Info & Socials */}
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <img src="/logo.png" alt="Atelier Logo" className={styles.logoImg} />
              <div className={styles.logoText}>
                <span className={styles.brandName}>Atelier</span>
                <span className={styles.brandSub}>Coding School</span>
              </div>
            </div>
            
            {/* Social Icons Row */}
            <div className={styles.socialsRow}>
              {/* Instagram */}
              <a href="#" className={styles.socialIcon} aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className={styles.socialIcon} aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              {/* Discord */}
              <a href="#" className={styles.socialIcon} aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="12" r="1"></circle>
                  <circle cx="15" cy="12" r="1"></circle>
                  <path d="M19.78 6.11A20.47 20.47 0 0 0 15 4.5l-.21.45A17.9 17.9 0 0 0 9.21 5L9 4.5a20.47 20.47 0 0 0-4.78 1.61A21 21 0 0 0 2 17.5a20.89 20.89 0 0 0 5.22 2.5l1-1.32a13 13 0 0 1-3.22-1.68l.21-.18A17.65 17.65 0 0 0 18.79 17l.21.18a13 13 0 0 1-3.22 1.68l1 1.32A20.89 20.89 0 0 0 22 17.5a21 21 0 0 0-2.22-11.39z"></path>
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" className={styles.socialIcon} aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" className={styles.socialIcon} aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className={styles.linksSubGrid}>
            {/* About Column */}
            <div className={styles.linksColumn}>
              <h4 className={styles.columnHeader}>ABOUT</h4>
              <ul className={styles.linksList}>
                <li><a href="#" className={styles.footerLink}>About Us</a></li>
                <li><a href="#" className={styles.footerLink}>Support</a></li>
                <li><a href="#" className={styles.footerLink}>Privacy Policy</a></li>
                <li><a href="#" className={styles.footerLink}>Pricing and Refund</a></li>
                <li><a href="#" className={styles.footerLink}>Terms and Conditions</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className={styles.linksColumn}>
              <h4 className={styles.columnHeader}>COMPANY</h4>
              <ul className={styles.linksList}>
                <li><a href="#" className={styles.footerLink}>Resume Checker</a></li>
                <li><a href="#" className={styles.footerLink}>Hire From Us</a></li>
                <li><a href="#" className={styles.footerLink}>Discord Community</a></li>
                <li><a href="#" className={styles.footerLink}>Jobs</a></li>
                <li><a href="#" className={styles.footerLink}>Submit Projects</a></li>
                <li><a href="#" className={styles.footerLink}>Feedback</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className={styles.linksColumn}>
              <h4 className={styles.columnHeader}>CONTACT</h4>
              <div className={styles.contactInfo}>
                <p className={styles.contactRow}>
                  <span className={styles.contactLabel}>Phone:</span> +91 7411288457
                </p>
                <p className={styles.contactRow}>
                  <a href="mailto:spherehive@kvgce.ac.in" className={styles.footerMail}>
                    spherehive@kvgce.ac.in
                  </a>
                </p>
                <p className={styles.contactAddress}>
                  Top Floor, MBA Block, <br />
                  KVGCE Campus, Kurunjibhag, <br />
                  Sullia, DK, Karnataka - 574327
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className={styles.bottomBar}>
          <p className={styles.copyrightText}>
            © {currentYear} Atelier Coding School. Powered by Sphere Hive. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
