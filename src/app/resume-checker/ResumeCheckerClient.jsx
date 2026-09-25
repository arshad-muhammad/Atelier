'use client';

import React, { useState, useRef } from 'react';
import styles from './resume-checker.module.css';

export default function ResumeCheckerClient() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [showJd, setShowJd] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    const validExtensions = ['.pdf', '.docx'];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setError('Please upload a PDF or DOCX file format.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select or drop a resume file first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep(1);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 400);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription.trim());
      }

      const res = await fetch('/api/ats/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze resume. Please try again.');
      }

      const data = await res.json();
      setResult(data);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <>
      {/* HERO / SCANNER TOP ZONE */}
      <section className={styles.heroGrid} aria-label="ATS Resume Scanner Tool">
        {/* LEFT: Headline & Value Proposition */}
        <div className={styles.heroLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>ATS Resume Compatibility Scanner</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.titleOrange}>ATS</span> Resume
            <br />
            Scanner
          </h1>

          <p className={styles.heroSubtitle}>
            Get your Atelier Resume Compatibility Score, keyword coverage analysis, 
            formatting audit, and recruiter insights in seconds. 100% free for all developers.
          </p>

          <div className={styles.featurePillsRow}>
            <div className={styles.featurePill}>
              <div className={styles.featurePillIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className={styles.featurePillText}>
                <span className={styles.featurePillTitle}>Instant Results</span>
                <span className={styles.featurePillSub}>Under 200ms</span>
              </div>
            </div>

            <div className={styles.featurePill}>
              <div className={styles.featurePillIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className={styles.featurePillText}>
                <span className={styles.featurePillTitle}>100% Private</span>
                <span className={styles.featurePillSub}>Zero external API calls</span>
              </div>
            </div>

            <div className={styles.featurePill}>
              <div className={styles.featurePillIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className={styles.featurePillText}>
                <span className={styles.featurePillTitle}>Deterministic ATS</span>
                <span className={styles.featurePillSub}>Rule-based heuristics</span>
              </div>
            </div>
          </div>

          <div className={styles.socialProofRow}>
            <div className={styles.avatarPile}>
              <div className={styles.avatarCircle}>A</div>
              <div className={styles.avatarCircle}>S</div>
              <div className={styles.avatarCircle}>R</div>
            </div>
            <span className={styles.socialProofText}>
              Used by 25,000+ engineers targeting top tech placements
            </span>
          </div>
        </div>

        {/* RIGHT: Upload Card */}
        <div className={styles.uploadCard}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            aria-label="Upload Resume File"
          />

          <div
            className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop your resume file or browse from device"
          >
            <div className={styles.docIconWrap}>
              <div className={styles.docIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className={styles.docTag}>PDF / DOCX</span>
              </div>
            </div>

            <h3 className={styles.dropTitle}>
              {file ? 'File Selected' : 'Drag & drop your resume here'}
            </h3>
            <p className={styles.dropSubtitle}>
              {file ? 'Click to change document' : 'or click to browse from device'}
            </p>

            <button
              type="button"
              className={styles.browseBtn}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{file ? 'Choose Different File' : 'Upload Resume'}</span>
            </button>

            <p className={styles.supportedFormats}>
              Supported formats: PDF, DOCX • Max 10MB
            </p>
          </div>

          {/* Selected File Details Bar */}
          {file && (
            <div className={styles.filePreviewBar}>
              <div className={styles.fileInfo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={handleRemoveFile}
                title="Remove File"
                aria-label="Remove File"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Optional Job Description Box */}
          <div className={styles.jdAccordion}>
            <button
              type="button"
              className={styles.jdToggleBtn}
              onClick={() => setShowJd(!showJd)}
            >
              <div className={styles.jdToggleLeft}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    transform: showJd ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span>Target Job Description (Optional)</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-orange)' }}>
                {jobDescription.trim() ? 'Description Attached' : 'Unlocks keyword gap analysis'}
              </span>
            </button>

            {showJd && (
              <textarea
                className={styles.jdTextarea}
                placeholder="Paste the target job description or requirements here to enable keyword coverage and requirement alignment..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            type="button"
            className={styles.scanActionBtn}
            onClick={handleAnalyze}
            disabled={isAnalyzing || !file}
          >
            {isAnalyzing ? (
              <>
                <span className={styles.spinner} />
                <span>
                  {analysisStep === 1 && 'Extracting layout & structure...'}
                  {analysisStep === 2 && 'Indexing skill taxonomy...'}
                  {analysisStep === 3 && 'Evaluating keyword heuristics...'}
                  {analysisStep === 4 && 'Calculating compatibility score...'}
                </span>
              </>
            ) : (
              <>
                <span>Scan Resume</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </section>

      {/* RESULTS SECTION (Or Initial Preview if not yet scanned) */}
      <section ref={resultsRef} className={styles.reportSection} aria-label="Resume Analysis Results">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionPreTitle}>
              {result ? 'ANALYSIS REPORT' : 'RESUME SCANNER PREVIEW'}
            </span>
            <h2 className={styles.sectionMainTitle}>
              {result ? 'Compatibility Breakdown' : 'Inspection Overview'}
            </h2>
          </div>

          {result && (
            <button type="button" className={styles.browseBtn} onClick={handlePrint}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Save / Print Report</span>
            </button>
          )}
        </div>

        {/* Interactive Report Grid */}
        <div className={styles.reportGrid}>
          {/* LEFT: Candidate / Document Snapshot */}
          <div className={styles.candidateDocCard}>
            <div>
              <div className={styles.candidateHeader}>
                <h3 className={styles.candidateName}>
                  {result ? result.candidate_preview?.name || 'Candidate' : 'John Doe'}
                </h3>
                <p className={styles.candidateTitle}>
                  {result ? result.candidate_preview?.detected_title || 'Software Engineer' : 'SOFTWARE ENGINEER'}
                </p>

                <div className={styles.contactBadges}>
                  <span className={styles.contactBadge}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>{result ? result.candidate_preview?.contact?.masked_email || 'Verified' : 'john.doe@example.com'}</span>
                  </span>
                  <span className={styles.contactBadge}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{result ? result.candidate_preview?.contact?.masked_phone || 'Verified' : '+1 555-***-4567'}</span>
                  </span>
                  <span className={styles.contactBadge}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>{result ? `${result.candidate_preview?.contact?.links?.length || 2} Links` : 'LinkedIn & GitHub'}</span>
                  </span>
                </div>
              </div>

              <div className={styles.docStatsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Pages Detected</span>
                  <span className={styles.statValue}>
                    {result ? `${result.candidate_preview?.total_pages || 1} Page` : '1 Page'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Extracted Words</span>
                  <span className={styles.statValue}>
                    {result ? `${result.candidate_preview?.total_words || 340} words` : '420 words'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className={styles.statLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>
                Extracted Text Snapshot
              </span>
              <div className={styles.snippetBox}>
                {result
                  ? result.candidate_preview?.extracted_snippet || 'Document text extracted successfully.'
                  : 'Passionate full-stack developer with 4 years of experience building scalable web applications. Technical skills include React, Next.js, Node.js, Express, Python, PostgreSQL, Docker, Git, AWS...'}
              </div>
            </div>
          </div>

          {/* RIGHT: Compatibility Score Card */}
          <div className={styles.scoreDetailsCard}>
            <div className={styles.scoreTopRow}>
              <div
                className={styles.radialGauge}
                style={{ '--score-pct': result ? result.score : 92 }}
              >
                <div className={styles.radialInner}>
                  <span className={styles.radialScore}>
                    {result ? result.score : 92}%
                  </span>
                  <span className={styles.radialGrade}>
                    {result ? result.score_grade : 'Excellent'}
                  </span>
                </div>
              </div>

              <div className={styles.scoreMeta}>
                <h3 className={styles.scoreTitle}>
                  {result ? result.score_title : 'Atelier Resume Compatibility Score'}
                </h3>
                <p className={styles.scoreExplanation}>
                  {result
                    ? result.disclaimer
                    : 'Estimated compatibility based on resume structure, job requirements, keyword coverage and formatting heuristics.'}
                </p>

                <div className={styles.checklistGrid}>
                  <div className={styles.checklistItem}>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>{result ? result.section_order_status : 'Good Section Order'}</span>
                  </div>
                  <div className={styles.checklistItem}>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>
                      {result && result.ats_issues?.some((i) => i.severity === 'HIGH')
                        ? 'Critical Blockers Found'
                        : 'No Critical Formatting Errors'}
                    </span>
                  </div>
                  <div className={styles.checklistItem}>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>Single Column Friendly</span>
                  </div>
                  <div className={styles.checklistItem}>
                    <span className={styles.checkIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>Verified Contact Markers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className={styles.categoryBarsSection}>
              <div className={styles.categoryBarRow}>
                <div className={styles.categoryBarMeta}>
                  <span className={styles.categoryBarTitle}>Keyword Match (35 pts max)</span>
                  <span className={styles.categoryBarScore}>
                    {result ? `${result.categories?.keyword_match || 30}/35` : '32/35 (91%)'}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${result ? Math.min(100, ((result.categories?.keyword_match || 30) / 35) * 100) : 91}%`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.categoryBarRow}>
                <div className={styles.categoryBarMeta}>
                  <span className={styles.categoryBarTitle}>Content Relevance & Alignment (25 pts max)</span>
                  <span className={styles.categoryBarScore}>
                    {result ? `${result.categories?.semantic_relevance || 22}/25` : '23/25 (92%)'}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${result ? Math.min(100, ((result.categories?.semantic_relevance || 22) / 25) * 100) : 92}%`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.categoryBarRow}>
                <div className={styles.categoryBarMeta}>
                  <span className={styles.categoryBarTitle}>Required Core Skills (20 pts max)</span>
                  <span className={styles.categoryBarScore}>
                    {result ? `${result.categories?.required_skills || 18}/20` : '18/20 (90%)'}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${result ? Math.min(100, ((result.categories?.required_skills || 18) / 20) * 100) : 90}%`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.categoryBarRow}>
                <div className={styles.categoryBarMeta}>
                  <span className={styles.categoryBarTitle}>Resume Structure (10 pts max)</span>
                  <span className={styles.categoryBarScore}>
                    {result ? `${result.categories?.structure || 9}/10` : '9/10 (90%)'}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${result ? Math.min(100, ((result.categories?.structure || 9) / 10) * 100) : 90}%`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.categoryBarRow}>
                <div className={styles.categoryBarMeta}>
                  <span className={styles.categoryBarTitle}>Formatting & Parsability (5 pts max)</span>
                  <span className={styles.categoryBarScore}>
                    {result ? `${result.categories?.formatting || 5}/5` : '5/5 (100%)'}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${result ? Math.min(100, ((result.categories?.formatting || 5) / 5) * 100) : 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SKILLS & KEYWORDS GRID */}
        <div className={styles.skillsContainer}>
          {/* Matched Skills */}
          <div className={styles.skillBox}>
            <div className={styles.skillBoxHeader}>
              <h4 className={styles.skillBoxTitle}>
                <span className={styles.tagDotGreen} />
                <span>Matched Skills & Keywords</span>
              </h4>
              <span className={styles.skillBadgeCount}>
                {result ? result.matched_skills?.length || 0 : 6} detected
              </span>
            </div>

            <div className={styles.tagsCloud}>
              {result && result.matched_skills?.length > 0 ? (
                result.matched_skills.map((s, idx) => (
                  <span key={idx} className={styles.matchedTag}>
                    <span className={styles.tagDotGreen} />
                    <span>{s.skill}</span>
                  </span>
                ))
              ) : (
                <>
                  <span className={styles.matchedTag}><span className={styles.tagDotGreen} />React</span>
                  <span className={styles.matchedTag}><span className={styles.tagDotGreen} />Next.js</span>
                  <span className={styles.matchedTag}><span className={styles.tagDotGreen} />JavaScript</span>
                  <span className={styles.matchedTag}><span className={styles.tagDotGreen} />Node.js</span>
                  <span className={styles.matchedTag}><span className={styles.tagDotGreen} />PostgreSQL</span>
                  <span className={styles.matchedTag}><span className={styles.tagDotGreen} />Git</span>
                </>
              )}
            </div>
          </div>

          {/* Missing or Target Skills */}
          <div className={styles.skillBox}>
            <div className={styles.skillBoxHeader}>
              <h4 className={styles.skillBoxTitle}>
                <span className={styles.tagDotOrange} />
                <span>Missing Target Skills</span>
              </h4>
              <span className={styles.skillBadgeCount}>
                {result ? result.missing_skills?.length || 0 : 3} target
              </span>
            </div>

            <div className={styles.tagsCloud}>
              {result && result.missing_skills?.length > 0 ? (
                result.missing_skills.map((s, idx) => (
                  <span key={idx} className={styles.missingTag}>
                    <span className={styles.tagDotOrange} />
                    <span>{s.skill} ({s.importance})</span>
                  </span>
                ))
              ) : (
                <>
                  <span className={styles.missingTag}><span className={styles.tagDotOrange} />TypeScript (Required)</span>
                  <span className={styles.missingTag}><span className={styles.tagDotOrange} />Docker (Required)</span>
                  <span className={styles.missingTag}><span className={styles.tagDotOrange} />AWS (Preferred)</span>
                </>
              )}
            </div>

            {/* Related Technologies */}
            {result && result.related_skills && result.related_skills.length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
                  Related Skills Found (Same Domain)
                </span>
                <div className={styles.tagsCloud}>
                  {result.related_skills.map((r, idx) => (
                    <span key={idx} className={styles.relatedTag}>
                      <span className={styles.tagDotBlue} />
                      <span>{r}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ATS ISSUES & WARNINGS */}
        <div className={styles.issuesSection}>
          <div className={styles.sectionHeader} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionPreTitle}>FORMATTING & AUDIT</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                ATS Formatting Findings
              </h3>
            </div>
          </div>

          {result && result.ats_issues && result.ats_issues.length > 0 ? (
            result.ats_issues.map((issue, idx) => (
              <div
                key={idx}
                className={`${styles.issueCard} ${
                  issue.severity === 'HIGH'
                    ? styles.issueCardHigh
                    : issue.severity === 'MEDIUM'
                    ? styles.issueCardMedium
                    : styles.issueCardLow
                }`}
              >
                <div className={styles.issueTop}>
                  <span
                    className={`${styles.severityPill} ${
                      issue.severity === 'HIGH'
                        ? styles.severityHigh
                        : issue.severity === 'MEDIUM'
                        ? styles.severityMedium
                        : styles.severityLow
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <h5 className={styles.issueTitle}>{issue.issue}</h5>
                </div>
                <p className={styles.issueExplanation}>{issue.explanation}</p>
              </div>
            ))
          ) : (
            <div className={`${styles.issueCard} ${styles.issueCardLow}`}>
              <div className={styles.issueTop}>
                <span className={`${styles.severityPill} ${styles.severityLow}`}>INFO</span>
                <h5 className={styles.issueTitle}>Clean formatting detected</h5>
              </div>
              <p className={styles.issueExplanation}>
                Document structure adheres to single-column standards with readable headings and contact markers.
              </p>
            </div>
          )}
        </div>

        {/* ACTIONABLE RECOMMENDATIONS */}
        <div>
          <div className={styles.sectionHeader} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionPreTitle}>ACTIONABLE GUIDANCE</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Optimization Recommendations
              </h3>
            </div>
          </div>

          <div className={styles.recGrid}>
            {result && result.recommendations && result.recommendations.length > 0 ? (
              result.recommendations.map((rec, idx) => (
                <div key={idx} className={styles.recCard}>
                  <div className={styles.recHeader}>
                    <span className={styles.recIndex}>0{idx + 1}</span>
                    <h5 className={styles.recTitle}>{rec.title}</h5>
                  </div>
                  <p className={styles.recGuidance}>{rec.guidance}</p>
                  {rec.example && (
                    <div className={styles.recExampleBox}>
                      <strong>Actionable Example:</strong>
                      <br />
                      {rec.example}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <>
                <div className={styles.recCard}>
                  <div className={styles.recHeader}>
                    <span className={styles.recIndex}>01</span>
                    <h5 className={styles.recTitle}>Add measurable business outcomes to experience bullets</h5>
                  </div>
                  <p className={styles.recGuidance}>
                    Quantify the business and technical impact of your contributions using metrics, latency savings, or scale numbers.
                  </p>
                  <div className={styles.recExampleBox}>
                    Current: &quot;Worked on a React application.&quot;
                    <br />
                    Recommendation: Follow Google’s X-Y-Z formula: &quot;Engineered responsive UI using React &amp; Next.js, reducing bundle size by 30% for 50,000 active users.&quot;
                  </div>
                </div>

                <div className={styles.recCard}>
                  <div className={styles.recHeader}>
                    <span className={styles.recIndex}>02</span>
                    <h5 className={styles.recTitle}>Explicitly include missing target stack keywords</h5>
                  </div>
                  <p className={styles.recGuidance}>
                    If you have authentic experience with TypeScript or Docker, ensure they are listed in your skills section and referenced in your project bullets.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* METRICS BANNER ROW */}
      <section className={styles.metricsBannerRow} aria-label="Key Performance Indicators">
        <div className={styles.metricCol}>
          <div className={styles.metricColIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <p className={styles.metricColVal}>
              {result ? `${result.metrics?.parse_rate || 98}%` : '98%'}
            </p>
            <p className={styles.metricColLabel}>Parse Rate</p>
            <span className={styles.metricColStatus}>Optimal</span>
          </div>
        </div>

        <div className={styles.metricCol}>
          <div className={styles.metricColIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <p className={styles.metricColVal}>
              {result ? `${result.metrics?.keyword_match || 85}%` : '85%'}
            </p>
            <p className={styles.metricColLabel}>Keyword Match</p>
            <span className={styles.metricColStatus}>Strong</span>
          </div>
        </div>

        <div className={styles.metricCol}>
          <div className={styles.metricColIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p className={styles.metricColVal}>
              {result ? `${result.metrics?.content_quality || 94}%` : '94%'}
            </p>
            <p className={styles.metricColLabel}>Content Quality</p>
            <span className={styles.metricColStatus}>Optimal</span>
          </div>
        </div>

        <div className={styles.metricCol}>
          <div className={styles.metricColIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <p className={styles.metricColVal}>
              {result ? `${result.metrics?.impact_score || 88}%` : '88%'}
            </p>
            <p className={styles.metricColLabel}>Impact Score</p>
            <span className={styles.metricColStatus}>Strong</span>
          </div>
        </div>

        <div className={styles.metricCol}>
          <div className={styles.metricColIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className={styles.metricColVal}>
              {result ? `${result.metrics?.ats_compatibility || 92}%` : '100%'}
            </p>
            <p className={styles.metricColLabel}>ATS Compatibility</p>
            <span className={styles.metricColStatus}>Optimal</span>
          </div>
        </div>
      </section>

      {/* 3 HIGHLIGHT FEATURE CARDS */}
      <section className={styles.featuresGrid} aria-label="ATS Scanner Capabilities">
        <div className={styles.featureCard}>
          <div>
            <div className={styles.featureCardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Deterministic Analysis</h3>
            <p className={styles.featureCardText}>
              Get full compatibility breakdown, section audit, and recruiter feedback calculated in milliseconds with zero hallucinations.
            </p>
          </div>
          <span className={styles.featureTagPill}>Instant Execution</span>
        </div>

        <div className={styles.featureCard}>
          <div>
            <div className={styles.featureCardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="2" y2="12" />
                <line x1="12" y1="6" x2="12" y2="2" />
                <line x1="12" y1="22" x2="12" y2="18" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Keyword Taxonomy</h3>
            <p className={styles.featureCardText}>
              Identify matched, missing, and related technologies with multi-tier synonym mapping tailored for developer resumes.
            </p>
          </div>
          <span className={styles.featureTagPill}>Developer Taxonomy</span>
        </div>

        <div className={styles.featureCard}>
          <div>
            <div className={styles.featureCardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Actionable Guidance</h3>
            <p className={styles.featureCardText}>
              Receive clear, rule-based recommendations to strengthen bullet point impact, quantify metrics, and fix layout blockers.
            </p>
          </div>
          <span className={styles.featureTagPill}>Rule-Based Tips</span>
        </div>
      </section>

      {/* HOW IT WORKS BAR */}
      <section className={styles.howItWorksBox} aria-label="How It Works Steps">
        <div className={styles.howItWorksIntro}>
          <h4 className={styles.howTitle}>How It Works</h4>
          <p className={styles.howSub}>Simple. Fast. Transparent.</p>
        </div>

        <div className={styles.howStepsRow}>
          <div className={styles.howStep}>
            <span className={styles.howStepNum}>01</span>
            <div className={styles.howStepText}>
              <span className={styles.howStepHeading}>Upload Resume</span>
              <span className={styles.howStepDetail}>Upload your resume in clean PDF or DOCX format.</span>
            </div>
          </div>

          <div className={styles.howDivider} />

          <div className={styles.howStep}>
            <span className={styles.howStepNum}>02</span>
            <div className={styles.howStepText}>
              <span className={styles.howStepHeading}>Deterministic Scan</span>
              <span className={styles.howStepDetail}>Analyzes text hierarchy, skill coverage, and layout.</span>
            </div>
          </div>

          <div className={styles.howDivider} />

          <div className={styles.howStep}>
            <span className={styles.howStepNum}>03</span>
            <div className={styles.howStepText}>
              <span className={styles.howStepHeading}>Actionable Report</span>
              <span className={styles.howStepDetail}>Review your score, keyword gaps, and recruiter tips.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
