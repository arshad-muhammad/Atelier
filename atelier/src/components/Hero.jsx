'use client';

import React, { useState, useEffect } from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  const words = ["Companies", "Google", "Microsoft", "Amazon", "OpenAI", "Walmart", "TCS"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const currentWord = words[currentWordIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        // Typing
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        if (displayedText === currentWord) {
          // Pause at full word before deleting
          timer = setTimeout(() => setIsDeleting(true), 1500);
          return;
        }
      } else {
        // Deleting
        setDisplayedText(currentWord.substring(0, displayedText.length - 1));
        if (displayedText === "") {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
          return;
        }
      }
      
      const typingSpeed = isDeleting ? 60 : 120;
      timer = setTimeout(handleTyping, typingSpeed);
    };

    timer = setTimeout(handleTyping, 100);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]);

  return (
    <section className={styles.heroSection}>
      <div className={styles.backgroundGrid}>
        <div className={styles.glowEffect}></div>
      </div>
      
      <div className={`${styles.container} container`}>
        <div className={styles.badge}>
          LEARN. BUILD. GET PLACED.
        </div>
        
        <h1 className={styles.title}>
          Build the Skills <br />
          <span className={styles.outlineBox}>
            {displayedText}
            <span className={styles.cursor}>|</span>
          </span> Actually Hire For
        </h1>
        
        <p className={styles.subtitle}>
          Join a community of ambitious students preparing for tech careers at Atelier by Sphere Hive.
        </p>
        
        <div className={styles.socialProof}>
          <div className={styles.avatarGroup}>
            <img src="/images/avatar1.jpg" alt="Student 1" className={styles.avatar} />
            <img src="/images/avatar2.jpg" alt="Student 2" className={styles.avatar} />
            <img src="/images/avatar3.jpg" alt="Student 3" className={styles.avatar} />
            <img src="/images/avatar4.jpg" alt="Student 4" className={styles.avatar} />
          </div>
          <p className={styles.proofText}>
            <span className={styles.orangeHighlight}>1 Million+</span> Students learning in our mastery programs
          </p>
        </div>
        
        <button className={styles.ctaButton}>
          Start Journey
          <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </section>
  );
}
