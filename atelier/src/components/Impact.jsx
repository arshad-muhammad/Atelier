'use client';

import React, { useRef, useEffect } from 'react';
import styles from './Impact.module.css';

export default function Impact() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const headingRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !trackRef.current) return;

      const container = containerRef.current;
      const track = trackRef.current;
      const heading = headingRef.current;
      const overlay = overlayRef.current;

      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;

      // Scroll position relative to the container start
      const scrollY = window.scrollY;
      const startPos = containerTop;
      const endPos = containerTop + containerHeight - windowHeight;

      if (scrollY >= startPos && scrollY <= endPos) {
        // Calculate scroll percentage within the sticky range
        const totalStickyDistance = endPos - startPos;
        const currentStickyDistance = scrollY - startPos;
        const progress = currentStickyDistance / totalStickyDistance;

        // Calculate maximum horizontal scroll translate
        const maxTranslate = track.scrollWidth - window.innerWidth;
        const translateX = progress * maxTranslate;

        // Apply translate
        track.style.transform = `translate3d(-${translateX}px, 0, 0) scale(1)`;
        
        // Reset opacity when inside sticky range
        track.style.opacity = '1';
        if (heading) heading.style.opacity = '1';
        if (overlay) overlay.style.opacity = '0';
      } else if (scrollY < startPos) {
        track.style.transform = 'translate3d(0, 0, 0) scale(1)';
        track.style.opacity = '1';
        if (heading) heading.style.opacity = '1';
        if (overlay) overlay.style.opacity = '0';
      } else if (scrollY > endPos) {
        const maxTranslate = track.scrollWidth - window.innerWidth;

        // Calculate fade progress (past endPos, up to 1 windowHeight)
        const fadeProgress = Math.min((scrollY - endPos) / windowHeight, 1);
        const targetOpacity = 1 - fadeProgress * 0.8; // Fade down to 0.2
        const scale = 1 - fadeProgress * 0.05; // scales from 1.0 to 0.95

        track.style.transform = `translate3d(-${maxTranslate}px, 0, 0) scale(${scale})`;
        track.style.opacity = targetOpacity;
        if (heading) heading.style.opacity = targetOpacity;
        if (overlay) overlay.style.opacity = (fadeProgress * 0.95).toString();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial run
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const cards = [
    {
      id: 1,
      image: '/images/impact1.png',
      featured: true,
      title: 'Coming To Your Campus',
      description: 'This Time The Feature Was At IIIT Bhopal, Where We Talked About How To Stay Ahead Of The Crowd.'
    },
    {
      id: 2,
      image: '/images/impact2.png',
      featured: false,
      title: 'Practical Coding Sessions',
      description: 'Hands-on training, where students build real-world products and learn standard practices.'
    },
    {
      id: 3,
      image: '/images/impact3.png',
      featured: false,
      title: 'Mentor Support & Growth',
      description: 'Interact with industry professionals who guide you throughout your learning journey.'
    },
    {
      id: 4,
      image: '/images/impact4.png',
      featured: false,
      title: 'Campus Life & Community',
      description: 'Build a strong network with like-minded coders and grow together.'
    }
  ];

  return (
    <section ref={containerRef} className={styles.impactSection}>
      <div className={styles.stickyWrapper}>
        <div ref={overlayRef} className={styles.darkOverlay} />
        <div ref={headingRef} className={styles.headingArea}>
          <span className={styles.badge}>IMPACT</span>
          <h2 className={styles.title}>The Atelier Advantage</h2>
        </div>

        <div ref={trackRef} className={styles.horizontalTrack}>
          {cards.map((card) => (
            <div key={card.id} className={styles.impactCard}>
              <div className={styles.cardInner}>
                <img src={card.image} alt={card.title} className={styles.cardImage} />
                
                {/* Arrow indicator on top-right of card */}
                <div className={styles.arrowIndicator}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>

                {card.featured && (
                  <div className={styles.featuredBadge}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.featuredIcon}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Featured
                  </div>
                )}

                {/* Speaker Crown Doodle Overlay (specifically for card 1) */}
                {card.id === 1 && (
                  <svg className={styles.crownDoodle} viewBox="0 0 100 50">
                    <path d="M20 40 L30 15 L50 30 L70 15 L80 40 Z" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="30" cy="12" r="2.5" fill="#ffffff" />
                    <circle cx="50" cy="27" r="2.5" fill="#ffffff" />
                    <circle cx="70" cy="12" r="2.5" fill="#ffffff" />
                  </svg>
                )}

                <div className={styles.cardGradientOverlay}></div>
                <div className={styles.cardOrangeOverlay}></div>
                
                <div className={styles.cardTextContent}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardDescription}>{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
