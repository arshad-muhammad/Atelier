'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLightNavbar, setIsLightNavbar] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navPillsRef = useRef(null);

  const navItems = [
    { label: 'Home', href: '#' },
    { label: 'Courses', href: '#courses' },
    { label: 'Bootcamp', href: '#bootcamp' },
    { label: 'Request Callback', href: '#callback' }
  ];

  useEffect(() => {
    const updateIndicator = () => {
      if (navPillsRef.current) {
        const activeEl = navPillsRef.current.querySelector(`.${styles.active}`);
        if (activeEl) {
          setIndicatorStyle({
            left: activeEl.offsetLeft,
            width: activeEl.offsetWidth,
            opacity: 1
          });
        }
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeIndex]);

  useEffect(() => {
    const coursesEl = document.getElementById('courses');
    const communityEl = document.getElementById('community');
    const navbarHeight = 80;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Add background when scrolled past a threshold
      if (currentScrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // Detect active light sections
      let lightActive = false;
      [coursesEl, communityEl].forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= navbarHeight && rect.bottom >= navbarHeight) {
          lightActive = true;
        }
      });
      setIsLightNavbar(lightActive);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial run
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMouseEnter = (e) => {
    const el = e.currentTarget;
    setIndicatorStyle({
      left: el.offsetLeft,
      width: el.offsetWidth,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    if (navPillsRef.current) {
      const activeEl = navPillsRef.current.querySelector(`.${styles.active}`);
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    }
  };

  const headerClass = `${styles.header} ${isVisible ? styles.visible : styles.hidden} ${isScrolled ? styles.scrolled : ''} ${isLightNavbar ? styles.lightTheme : ''}`;

  return (
    <header className={headerClass}>
      <div className={styles.logo}>
        <img src="/logo.png" alt="Atelier Logo" className={styles.logoImg} />
        <div className={styles.logoText}>
          <span className={styles.brandName}>Atelier</span>
          <span className={styles.brandSub}>Coding School</span>
        </div>
      </div>
      
      <nav className={styles.nav}>
        <div ref={navPillsRef} className={styles.navPills} onMouseLeave={handleMouseLeave}>
          {/* Sliding Liquid Indicator */}
          <div className={styles.navIndicator} style={indicatorStyle} />
          
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`${styles.navLink} ${activeIndex === idx ? styles.active : ''}`}
              onMouseEnter={handleMouseEnter}
              onClick={() => setActiveIndex(idx)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
      
      <div className={styles.actions}>
        <a href="#signin" className={styles.signIn}>Sign In</a>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className={styles.mobileMenuBtn} 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.lineOpen : ''}`}></span>
        <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.lineOpen : ''}`}></span>
        <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.lineOpen : ''}`}></span>
      </button>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.overlayOpen : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`${styles.mobileNavLink} ${activeIndex === idx ? styles.mobileActive : ''}`}
              onClick={() => {
                setActiveIndex(idx);
                setIsMobileMenuOpen(false);
              }}
            >
              {item.label}
            </a>
          ))}
          <a href="#signin" className={styles.mobileSignIn} onClick={() => setIsMobileMenuOpen(false)}>Sign In</a>
        </div>
      </div>
    </header>
  );
}
