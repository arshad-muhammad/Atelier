'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track, trackPageView, getOrCreateSessionId } from '@/lib/analytics/client';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef('');

  useEffect(() => {
    // Initialize session ID safely
    getOrCreateSessionId();
  }, []);

  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Track page views non-blockingly
    try {
      trackPageView(pathname);
    } catch (e) {}
  }, [pathname]);

  // Track key product button clicks without blanket tracking
  useEffect(() => {
    const handleMeaningfulClick = (e) => {
      try {
        const target = e.target.closest('a, button');
        if (!target) return;

        const href = target.getAttribute('href') || '';
        const text = (target.textContent || '').trim().slice(0, 50);

        if (href.startsWith('/courses/') || text.toLowerCase().includes('enroll') || text.toLowerCase().includes('register')) {
          track('button_clicked', {
            source: pathname,
            metadata: {
              buttonText: text,
              targetHref: href
            }
          });
        }
      } catch (err) {}
    };

    document.addEventListener('click', handleMeaningfulClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleMeaningfulClick);
    };
  }, [pathname]);

  return null;
}
