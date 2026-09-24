'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardResumeCheckerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/resume-checker');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(255,255,255,0.7)' }}>
      <p>Redirecting to ATS Resume Checker...</p>
    </div>
  );
}
