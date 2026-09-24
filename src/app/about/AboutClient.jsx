'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap/dist/gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import styles from './about.module.css';

export default function AboutClient() {
  const heroRef = useRef(null);
  const philosophySectionRef = useRef(null);
  const visionRef = useRef(null);
  const teamRef = useRef(null);
  const leadersRef = useRef(null);

  const philosophyParagraph =
    "Software is a craft, not a theory. Build with rigor, think in systems, and engineer what endures.";

  const philosophyWords = philosophyParagraph.split(' ');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Hero Entrance Animation
      gsap.fromTo(
        heroRef.current.querySelectorAll(`.${styles.badge}, .${styles.heroTitle}, .${styles.heroSubtitle}, .${styles.heroActions}`),
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: 'power3.out'
        }
      );

      // 2. Our Philosophy - Pinned Letter-by-Letter Scrub to Clean Pure White
      if (philosophySectionRef.current) {
        const chars = philosophySectionRef.current.querySelectorAll(`.${styles.charSpan}`);
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: philosophySectionRef.current,
            start: 'top top',
            end: '+=750',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1
          }
        });

        tl.to(chars, {
          color: '#ffffff',
          stagger: 0.04,
          ease: 'none'
        });
      }

      // 3. Vision Cards Staggered Entrance
      if (visionRef.current) {
        const cards = visionRef.current.querySelectorAll(`.${styles.visionCard}`);
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            scrollTrigger: {
              trigger: visionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.18,
            ease: 'power2.out'
          }
        );
      }

      // 4. Team Split Animation
      if (teamRef.current) {
        gsap.fromTo(
          teamRef.current.querySelector(`.${styles.teamLeftContent}`),
          { opacity: 0, x: -40 },
          {
            scrollTrigger: {
              trigger: teamRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: 'power3.out'
          }
        );

        gsap.fromTo(
          teamRef.current.querySelector(`.${styles.teamRightImageWrap}`),
          { opacity: 0, x: 40, scale: 0.96 },
          {
            scrollTrigger: {
              trigger: teamRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.9,
            ease: 'power3.out'
          }
        );
      }

      // 5. Leaders Tilted Cards Floating & Reveal
      if (leadersRef.current) {
        const leaderCards = leadersRef.current.querySelectorAll(`.${styles.tiltedCard}`);
        gsap.fromTo(
          leaderCards,
          { opacity: 0, y: 50, scale: 0.92 },
          {
            scrollTrigger: {
              trigger: leadersRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.22,
            ease: 'power3.out'
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const logos = [
    {
      name: 'Amazon',
      svg: (
        <svg viewBox="0 0 100 32" className={styles.logoSvg}>
          <text x="5" y="20" fontFamily="var(--font-heading)" fontSize="18" fontWeight="800">amazon</text>
          <path d="M8,26 Q30,34 55,26" stroke="#f25522" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      )
    },
    {
      name: 'Walmart',
      svg: (
        <svg viewBox="0 0 120 32" className={styles.logoSvg}>
          <text x="5" y="22" fontFamily="var(--font-heading)" fontSize="18" fontWeight="800">Walmart</text>
          <g transform="translate(94, 16) scale(0.6)">
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#f25522" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="-10" y1="-6" x2="10" y2="6" stroke="#f25522" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="-10" y1="6" x2="10" y2="-6" stroke="#f25522" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </svg>
      )
    },
    {
      name: 'OpenAI',
      svg: (
        <svg viewBox="0 0 110 32" className={styles.logoSvg}>
          <text x="5" y="21" fontFamily="var(--font-heading)" fontSize="17" fontWeight="700">OpenAI</text>
        </svg>
      )
    },
    {
      name: 'Google',
      svg: (
        <svg viewBox="0 0 95 32" className={styles.logoSvg}>
          <text x="5" y="22" fontFamily="var(--font-heading)" fontSize="18" fontWeight="700">Google</text>
        </svg>
      )
    },
    {
      name: 'Microsoft',
      svg: (
        <svg viewBox="0 0 125 32" className={styles.logoSvg}>
          <g transform="translate(5, 7)">
            <rect x="0" y="0" width="8" height="8" fill="#f25522" />
            <rect x="10" y="0" width="8" height="8" fill="#ffffff" opacity="0.8" />
            <rect x="0" y="10" width="8" height="8" fill="#ffffff" opacity="0.8" />
            <rect x="10" y="10" width="8" height="8" fill="#f25522" />
          </g>
          <text x="30" y="21" fontFamily="var(--font-heading)" fontSize="16" fontWeight="600">Microsoft</text>
        </svg>
      )
    },
    {
      name: 'Razorpay',
      svg: (
        <svg viewBox="0 0 120 32" className={styles.logoSvg}>
          <polygon points="12,4 4,28 16,14 26,14" fill="#f25522" />
          <text x="32" y="22" fontFamily="var(--font-heading)" fontSize="17" fontWeight="800">Razorpay</text>
        </svg>
      )
    },
    {
      name: 'TCS',
      svg: (
        <svg viewBox="0 0 80 32" className={styles.logoSvg}>
          <text x="5" y="23" fontFamily="var(--font-heading)" fontSize="20" fontWeight="900">TCS</text>
        </svg>
      )
    },
    {
      name: 'Sphere Hive',
      svg: (
        <svg viewBox="0 0 140 32" className={styles.logoSvg}>
          <circle cx="14" cy="16" r="8" fill="#f25522" opacity="0.3" />
          <circle cx="14" cy="16" r="4" fill="#f25522" />
          <text x="30" y="21" fontFamily="var(--font-heading)" fontSize="16" fontWeight="700">Sphere Hive</text>
        </svg>
      )
    }
  ];

  const marqueeList = [...logos, ...logos, ...logos];

  return (
    <div className={styles.pageContainer}>
      {/* ==========================================================
          1. HERO SECTION
          ========================================================== */}
      <section ref={heroRef} className={styles.heroSection}>
        <div className={styles.heroSpotlight} />
        <div className={styles.heroBeamLeft} />
        <div className={styles.heroBeamRight} />
        <div className={styles.heroGridBg} />

        <div className={styles.heroContent}>
          <div className={styles.badge}>WHO WE ARE</div>

          <h1 className={styles.heroTitle}>
            Where Raw Ambition <br />
            <span className={styles.outlineBox}>Meets Engineering Craft</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Atelier is an immersive engineering academy established at the KVGCE incubation campus.
            We bridge the chasm between theoretical education and enterprise craft through rigorous,
            production-grade cohorts and direct mentor code reviews.
          </p>

          <div className={styles.heroActions}>
            <Link href="/courses" className={styles.primaryCta}>
              Explore Cohorts
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <a
              href="#philosophy"
              onClick={(e) => scrollToSection(e, 'philosophy')}
              className={styles.secondaryCta}
            >
              Our Philosophy
            </a>
          </div>
        </div>
      </section>

      {/* ==========================================================
          2. LOGOS MARQUEE (WHERE ALUMNI BUILD)
          ========================================================== */}
      <div className={styles.logosSection}>
        <div className={styles.logosTrack}>
          {marqueeList.map((item, idx) => (
            <div key={idx} className={styles.logoItem} title={item.name}>
              {item.svg}
            </div>
          ))}
        </div>
      </div>

      {/* ==========================================================
          3. OUR PHILOSOPHY - PINNED TEXT SCRUB REVEAL ANIMATION
          ========================================================== */}
      <section id="philosophy" ref={philosophySectionRef} className={styles.philosophySection}>
        <div className={styles.philosophyAmbientGlow} />

        <div className={styles.philosophyContainer}>
          <div className={styles.badge}>OUR PHILOSOPHY</div>

          <p className={styles.philosophyText}>
            {philosophyWords.map((word, wIdx) => (
              <span key={wIdx} className={styles.wordSpan}>
                {word.split('').map((char, cIdx) => (
                  <span key={cIdx} className={styles.charSpan}>
                    {char}
                  </span>
                ))}
                <span className={styles.spaceSpan}>&nbsp;</span>
              </span>
            ))}
          </p>

          <div className={styles.philosophyHint}>
            <span className={styles.scrollDot} />
            <span>Scroll to illuminate philosophy</span>
          </div>
        </div>
      </section>

      {/* ==========================================================
          4. VISION OF THE BRAND (3 PILLAR CARDS)
          ========================================================== */}
      <section id="vision" ref={visionRef} className={styles.visionSection}>
        <div className={styles.visionHeader}>
          <div className={styles.badge}>THE ATELIER STANDARD</div>
          <h2 className={styles.visionTitle}>Pillars Of The Atelier Craft</h2>
          <p className={styles.visionSubtitle}>
            Three foundational cornerstones that define our methodology, our culture, and our engineering expectations.
          </p>
        </div>

        <div className={styles.visionCardsGrid}>
          {/* Card 1 */}
          <div className={styles.visionCard}>
            <div>
              <div className={styles.visionCardTop}>
                <div className={styles.visionCardIconBadge}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <span className={styles.visionCardNumber}>01</span>
              </div>
              <h3 className={styles.visionCardTitle}>Production-Grade Immersion</h3>
              <p className={styles.visionCardDesc}>
                Say goodbye to toy todo lists. Every cohort fellow develops distributed microservices, writes
                rigorous test suites, and deploys high-availability systems under genuine cloud constraints.
              </p>
            </div>
            <div className={styles.visionCardBottom}>
              <Link href="/courses" className={styles.visionCardLink}>Explore Cohorts</Link>
              <div className={styles.arrowCircleBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className={styles.visionCard}>
            <div>
              <div className={styles.visionCardTop}>
                <div className={styles.visionCardIconBadge}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className={styles.visionCardNumber}>02</span>
              </div>
              <h3 className={styles.visionCardTitle}>Relentless Code Reviews</h3>
              <p className={styles.visionCardDesc}>
                Learn line-by-line from seasoned industry architects. Pull requests are vetted under real-world
                enterprise standards for scalability, readability, fault tolerance, and security.
              </p>
            </div>
            <div className={styles.visionCardBottom}>
              <Link href="/join-faculty" className={styles.visionCardLink}>Meet Faculty</Link>
              <div className={styles.arrowCircleBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className={styles.visionCard}>
            <div>
              <div className={styles.visionCardTop}>
                <div className={styles.visionCardIconBadge}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="12 8 8 12 12 16 16 12 12 8" />
                  </svg>
                </div>
                <span className={styles.visionCardNumber}>03</span>
              </div>
              <h3 className={styles.visionCardTitle}>The Sphere Hive Launchpad</h3>
              <p className={styles.visionCardDesc}>
                Headquartered in the KVGCE incubation center and driving national Hackwise hackathons,
                we connect ambitious student builders directly to startup founders, venture labs, and recruiters.
              </p>
            </div>
            <div className={styles.visionCardBottom}>
              <Link href="/contact" className={styles.visionCardLink}>Join Network</Link>
              <div className={styles.arrowCircleBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
          5. THE PEOPLE WHO MAKE ATELIER A REALITY (SPLIT)
          ========================================================== */}
      <section ref={teamRef} className={styles.teamSection}>
        <div className={styles.teamAmbientGlow} />

        <div className={styles.teamGrid}>
          <div className={styles.teamLeftContent}>
            <div className={styles.badge}>THE ATELIER COLLECTIVE</div>

            <h2 className={styles.teamTitle}>
              The People Who Make <br />
              <span className={styles.teamTitleHighlight}>Atelier A Reality</span>
            </h2>

            <p className={styles.teamParagraph}>
              Behind every line of review feedback, late-night sprint, and cohort breakthrough is an earnest collective
              of engineers, mentors, and community leads united by a shared obsession with builder culture.
            </p>

            <p className={styles.teamParagraph}>
              We reject passive, detached learning. In our campus labs and virtual war-rooms, our team works
              shoulder-to-shoulder with fellows to solve hard architectural puzzles, crush technical interviews, and ship real products.
            </p>

            <div className={styles.teamStatsPills}>
              <div className={styles.teamStatItem}>
                <span className={styles.teamStatValue}>20+</span>
                <span className={styles.teamStatLabel}>Mentors & Staff</span>
              </div>
              <div className={styles.teamStatItem}>
                <span className={styles.teamStatValue}>500+</span>
                <span className={styles.teamStatLabel}>Engineers Mentored</span>
              </div>
              <div className={styles.teamStatItem}>
                <span className={styles.teamStatValue}>100+</span>
                <span className={styles.teamStatLabel}>Production Projects</span>
              </div>
            </div>
          </div>

          <div className={styles.teamRightImageWrap}>
            <img
              src="https://hackaithon.spherehive.in/team-group.jpeg"
              onError={(e) => {
                e.currentTarget.src = "/images/team-group.jpeg";
              }}
              alt="The Atelier Collective Team Group"
              className={styles.teamImage}
            />
          </div>
        </div>
      </section>

      {/* ==========================================================
          6. THE LEADERS BEHIND THE CODE (SIGNATURE TILTED CARDS)
          ========================================================== */}
      <section ref={leadersRef} className={styles.leadersSection}>
        <div className={styles.leadersHeader}>
          <div className={styles.badge}>LEADERSHIP</div>
          <h2 className={styles.leadersTitle}>The Leaders Behind The Code</h2>
          <p className={styles.leadersSubtitle}>
            The engineering founders and operators stewarding Atelier's vision, curriculum, and community.
          </p>
        </div>

        <div className={styles.tiltedCardsContainer}>
          <div className={styles.leadersGlowOrb} />

          {/* Tilted Card 1: Top Left - Muhammad Arshad R A */}
          <div className={`${styles.tiltedCard} ${styles.tiltedCard1}`}>
            <div className={styles.tiltedCardImageWrap}>
              <img
                src="/images/arshad.jpeg"
                alt="Muhammad Arshad R A"
                className={styles.tiltedCardImg}
              />
              <div className={styles.tiltedCardOverlay} />
            </div>
            <div className={styles.tiltedCardMeta}>
              <div>
                <h4 className={styles.tiltedCardName}>Muhammad Arshad R A</h4>
                <p className={styles.tiltedCardRole}>Founder & CEO of Atelier</p>
              </div>
              <div className={styles.tiltedCardBadge} title="Verified Leader">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tilted Card 2: Center Right - C K Aashlesh Kumar */}
          <div className={`${styles.tiltedCard} ${styles.tiltedCard2}`}>
            <div className={styles.tiltedCardImageWrap}>
              <img
                src="/images/aashlesh.jpeg"
                alt="C K Aashlesh Kumar"
                className={styles.tiltedCardImg}
              />
              <div className={styles.tiltedCardOverlay} />
            </div>
            <div className={styles.tiltedCardMeta}>
              <div>
                <h4 className={styles.tiltedCardName}>C K Aashlesh Kumar</h4>
                <p className={styles.tiltedCardRole}>CTO of Atelier</p>
              </div>
              <div className={styles.tiltedCardBadge} title="Verified Leader">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tilted Card 3: Bottom Left - Srijesh K */}
          <div className={`${styles.tiltedCard} ${styles.tiltedCard3}`}>
            <div className={styles.tiltedCardImageWrap}>
              <img
                src="/images/srijesh.jpeg"
                alt="Srijesh K"
                className={styles.tiltedCardImg}
              />
              <div className={styles.tiltedCardOverlay} />
            </div>
            <div className={styles.tiltedCardMeta}>
              <div>
                <h4 className={styles.tiltedCardName}>Srijesh K</h4>
                <p className={styles.tiltedCardRole}>COO of Atelier</p>
              </div>
              <div className={styles.tiltedCardBadge} title="Verified Leader">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
