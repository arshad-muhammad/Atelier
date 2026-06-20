'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './SphereHive.module.css';

export default function SphereHive() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.sectionContainer} ${isVisible ? styles.sectionVisible : ''}`}>
      <div className={`${styles.container} container`}>
        <div className={styles.grid}>
          
          {/* Left Column: Narrative Details */}
          <div className={styles.leftCol}>
            <div className={styles.badgeWrapper}>
              <span className={styles.badge}>SPHERE HIVE</span>
            </div>
            
            <h2 className={styles.mainTitle}>
              Bridging Classroom Theory & Real-World SaaS Execution.
            </h2>
            
            <p className={styles.description}>
              Sphere Hive is a premier, student-led tech community and startup incubator lab located at KVG College of Engineering (KVGCE) in Sullia, Karnataka. Officially launched on November 21, 2024, our mission is to build a high-performance culture of peer-to-peer technical learning, product engineering, and business incubation.
            </p>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <h4 className={styles.featureTitle}>Hackwise National Hackathons</h4>
                <p className={styles.featureText}>
                  Our flagship 24-hour national hackathon series brings together hundreds of developers across the region to build AI models and SaaS integrations under intense pressure.
                </p>
              </div>

              <div className={styles.featureItem}>
                <h4 className={styles.featureTitle}>Startup Incubation & Lab</h4>
                <p className={styles.featureText}>
                  Operating from our dedicated lab, we mentor student developers from writing their first lines of code to building, launching, and deploying real SaaS products.
                </p>
              </div>

              <div className={styles.featureItem}>
                <h4 className={styles.featureTitle}>Peer-to-Peer Tech Ecosystem</h4>
                <p className={styles.featureText}>
                  No boring lectures. We foster active collaboration in emerging domains: AI/ML engineering, Full-Stack development, DevOps, and cloud systems architecture.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Blueprint Coordinate Card */}
          <div className={styles.rightCol}>
            <div className={styles.blueprintCard}>
              
              {/* SVG Blueprint Grid Draft */}
              <div className={styles.blueprintSvgWrapper}>
                <svg className={styles.blueprintSvg} viewBox="0 0 300 150" fill="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(242, 85, 34, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(242, 85, 34, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="300" y2="120" stroke="rgba(242, 85, 34, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  
                  <line x1="75" y1="0" x2="75" y2="150" stroke="rgba(242, 85, 34, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="150" y1="0" x2="150" y2="150" stroke="rgba(242, 85, 34, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="225" y1="0" x2="225" y2="150" stroke="rgba(242, 85, 34, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* Centered Sphere Hive Logo */}
                  <image href="/images/spherehive_logo.png" x="100" y="25" width="100" height="100" />
                </svg>
              </div>

              {/* Technical Information Rows */}
              <div className={styles.infoBlock}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>LOCATION:</span>
                  <span className={styles.infoValue}>TOP FLOOR, MBA BLOCK, KVGCE, Sullia</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>CAMPUS:</span>
                  <span className={styles.infoValue}>KVGCE, SULLIA, KA, IN</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ESTABLISHED:</span>
                  <span className={styles.infoValue}>NOV 21, 2024</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>FLAGSHIPS:</span>
                  <span className={styles.infoValue}>HACKWISE / HACK[AI]THON</span>
                </div>
              </div>

              {/* Blueprint Footer text */}
              <div className={styles.blueprintFooter}>
                <span className={styles.footerNote}>SPHERE HIVE LAB // PEER LED INNOVATION HUB</span>
                <span className={styles.badgePill}>HQ</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
