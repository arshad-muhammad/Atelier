'use client';

import React, { useState, useEffect } from 'react';
import styles from './TransformCTA.module.css';

export default function TransformCTA() {
  const words = ["Atelier", "Sphere Hive"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const currentWord = words[currentWordIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        if (displayedText === currentWord) {
          timer = setTimeout(() => setIsDeleting(true), 1500);
          return;
        }
      } else {
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

  // Blurred background card positions & images to replicate the depth-of-field gallery
  const backgroundCards = [
    { id: 1, image: '/images/students_classroom.png', style: { top: '10%', left: '8%', width: '140px', height: '90px' } },
    { id: 2, image: '/images/campus_speaker.png', style: { top: '5%', left: '42%', width: '160px', height: '100px' } },
    { id: 3, image: '/images/course_mentor_30.png', style: { top: '8%', right: '10%', width: '150px', height: '110px' } },
    { id: 4, image: '/images/group_students.png', style: { top: '45%', left: '12%', width: '120px', height: '80px' } },
    { id: 5, image: '/images/mentors_smiling.png', style: { bottom: '10%', left: '22%', width: '150px', height: '100px' } },
    { id: 6, image: '/images/course_data_science.png', style: { bottom: '8%', right: '25%', width: '160px', height: '110px' } },
    { id: 7, image: '/images/group_lawn.png', style: { bottom: '15%', left: '5%', width: '130px', height: '90px' } },
    { id: 8, image: '/images/course_cohort_2.png', style: { bottom: '12%', right: '8%', width: '140px', height: '95px' } }
  ];

  const handleScrollToCourses = () => {
    const coursesSection = document.getElementById('courses');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.ctaSection}>
      {/* Scattered Blurred Background Gallery */}
      <div className={styles.backgroundContainer}>
        {backgroundCards.map((card) => (
          <div 
            key={card.id} 
            className={styles.blurredCard} 
            style={card.style}
          >
            <img src={card.image} alt="" className={styles.cardImage} />
            <div className={styles.cardOverlay}></div>
          </div>
        ))}
      </div>

      {/* Foreground Interactive Content */}
      <div className={`${styles.container} container`}>
        <div className={styles.contentArea}>
          <h2 className={styles.title}>
            Transform Your Learning Journey <br />
            Into A Career Breakthrough With <br />
            <span className={styles.outlineBox}>
              {displayedText}
              <span className={styles.cursor}>|</span>
            </span>
          </h2>

          <button onClick={handleScrollToCourses} className={styles.exploreBtn}>
            Explore Courses
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
