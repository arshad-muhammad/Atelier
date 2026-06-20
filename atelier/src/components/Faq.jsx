'use client';

import React, { useState } from 'react';
import styles from './Faq.module.css';

export default function Faq() {
  const faqs = [
    {
      question: 'Who is Atelier Coding School for?',
      answer: 'Atelier is designed for absolute beginners, college students, and self-taught developers who want to bypass theoretical fluff and build real production-grade SaaS products. If you want to acquire skills that companies actually hire for, this is for you.'
    },
    {
      question: 'What makes Atelier different from other bootcamps or online courses?',
      answer: 'We are strictly project-based and skill-first. Instead of boring slides and static lectures, you learn by building real products. We provide continuously updated curricula, internal hackathons, code face-offs, and direct mentor code reviews.'
    },
    {
      question: 'Do I get a certificate upon completion?',
      answer: 'Yes, you will receive a verified industry certificate detailing the projects you built, your hackathon participations, and the technical skills you mastered throughout the cohort.'
    },
    {
      question: 'Is there active mentor support when I get stuck?',
      answer: 'Absolutely. We provide 24/7 dedicated mentor support. You can post your code doubts on our community channels, and get step-by-step guidance from senior developers.'
    },
    {
      question: 'How does the job-ready curriculum prepare me for interviews?',
      answer: 'Our syllabus includes DSA, system design, DevOps, and Gen AI integrations. We also host mock interviews, resume-building clinics, and aptitude sprints to ensure you confidently clear technical assessments.'
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className={styles.faqSection}>
      <div className={`${styles.container} container`}>
        <div className={styles.headerArea}>
          <div className={styles.badgeWrapper}>
            <span className={styles.badge}>QUESTIONS</span>
          </div>
          <h2 className={styles.mainTitle}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>
            Have questions about our curriculum, mentoring, or cohorts? We\'ve got you covered.
          </p>
        </div>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                onClick={() => handleToggle(index)}
              >
                <div className={styles.questionRow}>
                  <h3 className={styles.questionText}>{faq.question}</h3>
                  <div className={styles.iconWrapper}>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                      className={styles.toggleIcon}
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                </div>
                
                <div className={styles.answerRow}>
                  <div className={styles.answerContent}>
                    <p className={styles.answerText}>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
