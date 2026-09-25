import { parseDocument } from './parsers.js';
import { analyzeContact } from './contact.js';
import { segmentResume } from './sections.js';
import { extractSkillsFromText, parseJobDescription, matchKeywords } from './keywords.js';
import { analyzeExperience, extractBullets } from './experience.js';
import { matchContentRelevance } from './relevance.js';
import { analyzeFormatting } from './formatting.js';
import { calculateScore } from './scoring.js';

/**
 * Main Deterministic ATS Analyzer.
 * Completely in-process, pure JavaScript/Node.js, zero AI models or external microservices.
 */
export async function analyzeResume(fileBuffer, fileName = '', mimeType = '', jobDescription = '') {
  const startTime = performance.now();

  // 1. Document Parsing (PDF / DOCX)
  const parsedDoc = await parseDocument(fileBuffer, mimeType, fileName);
  const fullText = parsedDoc.fullText || '';

  if (fullText.length < 20) {
    throw new Error('Could not extract readable text from document. Please ensure the file is not empty or password protected.');
  }

  // 2. Contact Information Extraction & Privacy Masking
  const contactInfo = analyzeContact(fullText, parsedDoc.links);

  // 3. Section Segmentation & Ordering
  const sectionInfo = segmentResume(fullText);

  // 4. Skill Extraction from Resume Text
  const resumeSkills = extractSkillsFromText(fullText);

  // 5. Job Description Parsing (if provided)
  const hasJd = Boolean(jobDescription && jobDescription.trim());
  const jdAnalysis = parseJobDescription(jobDescription || '');

  // 6. Multi-tier Keyword Matching
  const keywordResult = matchKeywords(resumeSkills, jdAnalysis);

  // 7. Experience Impact & Bullet Verification
  const expText = sectionInfo.sections.experience || '';
  const experienceResult = analyzeExperience(expText);
  const bullets = extractBullets(expText);

  // 8. Deterministic Content Relevance (Replaces BGE embedding model without AI)
  const relevanceResult = matchContentRelevance(sectionInfo.sections, bullets, jdAnalysis);

  // 9. ATS Formatting Rules & Parsability Inspection
  const atsIssues = analyzeFormatting(parsedDoc, contactInfo, sectionInfo);

  // 10. Transparent Scoring Engine
  const scoringResult = calculateScore({
    parsedDoc,
    contactInfo,
    sectionInfo,
    keywordResult,
    relevanceResult,
    experienceResult,
    atsIssues,
    hasJd
  });

  const elapsedMs = performance.now() - startTime;

  // 11. Candidate Preview Generation
  let detectedTitle = 'Software Engineer';
  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(1, 6)) {
    if (/(?:engineer|developer|architect|designer|scientist|analyst|programmer|lead|manager)\b/i.test(line)) {
      detectedTitle = line;
      break;
    }
  }

  const candidatePreview = {
    name: contactInfo.candidate_name || 'Candidate',
    detected_title: detectedTitle,
    contact: contactInfo,
    total_pages: parsedDoc.pageCount || 1,
    total_words: parsedDoc.totalWords || 0,
    extracted_snippet: fullText.slice(0, 400)
  };

  return {
    score: scoringResult.score,
    score_grade: scoringResult.score_grade,
    score_title: 'Atelier Resume Compatibility Score',
    disclaimer: 'Estimated compatibility based on resume structure, job requirements, keyword coverage and formatting heuristics.',
    has_job_description: hasJd,
    categories: scoringResult.categories,
    metrics: scoringResult.metrics,
    matched_skills: keywordResult.matched_skills,
    missing_skills: keywordResult.missing_skills,
    related_skills: keywordResult.related_skills,
    detected_sections: sectionInfo.present_sections,
    missing_sections: sectionInfo.missing_sections,
    section_order_status: sectionInfo.is_order_good ? 'Good Section Order' : 'Section Order Warning',
    ats_issues: atsIssues,
    recommendations: scoringResult.recommendations,
    experience_highlights: experienceResult.improvement_highlights,
    candidate_preview: candidatePreview,
    processing_time_ms: Number(elapsedMs.toFixed(2))
  };
}
