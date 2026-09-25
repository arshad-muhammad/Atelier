/**
 * ATS Formatting, Layout, and Parsability Analyzer.
 * Identifies structural risks that could cause rejection in enterprise ATS parsers.
 */

export function analyzeFormatting(parsedDoc, contactInfo, sectionInfo) {
  const issues = [];

  // 1. Scanned Image / Unreadable text check (HIGH)
  if (parsedDoc.scannedImageSuspected) {
    issues.push({
      issue: 'Scanned image or empty text detected',
      severity: 'HIGH',
      explanation: 'The document has minimal extractable text. Enterprise ATS engines cannot index information from raster images without OCR.'
    });
  }

  // 2. Multi-column layout check (MEDIUM)
  if (parsedDoc.hasTwoColumns) {
    issues.push({
      issue: 'Two-column layout detected',
      severity: 'MEDIUM',
      explanation: 'Some legacy ATS parsers read columns horizontally across the page, which can interweave unrelated text between columns.'
    });
  }

  // 3. Complex Tables check (MEDIUM / LOW)
  const tableCount = parsedDoc.tableCount || 0;
  if (tableCount > 3) {
    issues.push({
      issue: `Multiple tables (${tableCount}) detected`,
      severity: 'MEDIUM',
      explanation: 'Extensive nested tables can confuse ATS text flows. Consider using clean bullet points and standard heading hierarchy instead.'
    });
  } else if (tableCount > 0) {
    issues.push({
      issue: 'Table formatting detected',
      severity: 'LOW',
      explanation: 'Tables were found in the document. Simple tables are usually parsed fine by modern ATS, but complex merged cells should be avoided.'
    });
  }

  // 4. Missing Contact Information
  if (!contactInfo.email_detected) {
    issues.push({
      issue: 'No email address detected',
      severity: 'HIGH',
      explanation: 'An email address is required by ATS systems to create your candidate profile and send communications.'
    });
  }

  if (!contactInfo.phone_detected) {
    issues.push({
      issue: 'No phone number detected',
      severity: 'MEDIUM',
      explanation: 'A recruiter contact phone number was not clearly identified in the text.'
    });
  }

  if (!contactInfo.linkedin_detected) {
    issues.push({
      issue: 'LinkedIn profile URL not detected',
      severity: 'LOW',
      explanation: 'Including a direct LinkedIn link increases recruiter response rate and profile verification speed.'
    });
  }

  if (!contactInfo.github_detected && !contactInfo.portfolio_detected) {
    issues.push({
      issue: 'No GitHub or Portfolio URL detected',
      severity: 'LOW',
      explanation: 'For engineering and tech roles, linking your GitHub or portfolio provides strong proof of work.'
    });
  }

  // 5. Missing standard sections (HIGH / MEDIUM)
  const presentSections = sectionInfo.present_sections || [];
  if (!presentSections.includes('experience')) {
    issues.push({
      issue: 'Experience section missing or unrecognized',
      severity: 'HIGH',
      explanation: "Could not find a standard 'Experience' or 'Work History' heading. This makes work timeline parsing unreliable."
    });
  }

  if (!presentSections.includes('skills')) {
    issues.push({
      issue: 'Skills section missing or unrecognized',
      severity: 'HIGH',
      explanation: "A dedicated 'Skills' or 'Technical Skills' section ensures automated ATS skill indexing finds your capabilities."
    });
  }

  if (!presentSections.includes('education')) {
    issues.push({
      issue: 'Education section missing or unrecognized',
      severity: 'MEDIUM',
      explanation: 'ATS parsers look for standard education headings to verify degree criteria and graduation timelines.'
    });
  }

  // 6. Excessive special characters or weird formatting (MEDIUM)
  const fullText = parsedDoc.fullText || '';
  const specialChars = (fullText.match(/[^\w\s.,;:/\-–—()@+]/g) || []).length;
  const totalChars = Math.max(1, fullText.length);
  if (specialChars / totalChars > 0.05) {
    issues.push({
      issue: 'Excessive decorative symbols or icon characters',
      severity: 'MEDIUM',
      explanation: 'Unusual icons, decorative shapes, or non-standard bullet symbols can parse as garbled text in older ATS engines.'
    });
  }

  // 7. Document length check (LOW / HIGH)
  const pageCount = parsedDoc.pageCount || 1;
  const totalWords = parsedDoc.totalWords || 0;
  if (pageCount > 3) {
    issues.push({
      issue: `Resume length (${pageCount} pages) is lengthy`,
      severity: 'LOW',
      explanation: 'Resumes exceeding 2-3 pages often face lower recruiter retention. Focus on the most recent and impactful experience.'
    });
  } else if (totalWords > 0 && totalWords < 120) {
    issues.push({
      issue: 'Resume is unusually brief',
      severity: 'HIGH',
      explanation: `Only ${totalWords} words extracted. Make sure your resume includes detailed project and experience descriptions.`
    });
  }

  return issues;
}
