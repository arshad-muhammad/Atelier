/**
 * Explainable ATS Scoring Engine for Atelier Resume Compatibility Score.
 * 100% Deterministic, transparent, and auditable calculation without AI.
 */

const WEIGHTS = {
  KEYWORD_MATCH: 35.0,
  CONTENT_RELEVANCE: 25.0,
  REQUIRED_SKILLS: 20.0,
  STRUCTURE: 10.0,
  FORMATTING: 5.0,
  CONTACT: 5.0
};

export function calculateScore({
  parsedDoc,
  contactInfo,
  sectionInfo,
  keywordResult,
  relevanceResult,
  experienceResult,
  atsIssues,
  hasJd
}) {
  // 1. Structure Points (max: 10)
  const presentSections = sectionInfo.present_sections || [];
  let structPoints = 0.0;
  if (presentSections.includes('experience')) structPoints += 4.5;
  if (presentSections.includes('skills')) structPoints += 3.5;
  if (presentSections.includes('education')) structPoints += 2.0;

  if (sectionInfo.is_order_good) {
    structPoints = Math.min(10.0, structPoints);
  } else {
    structPoints = Math.max(2.0, structPoints - 2.0);
  }
  const structure_score = Number(structPoints.toFixed(1));

  // 2. Formatting Points (max: 5)
  const highIssues = atsIssues.filter((i) => i.severity === 'HIGH').length;
  const medIssues = atsIssues.filter((i) => i.severity === 'MEDIUM').length;
  const formatPenalty = highIssues * 2.0 + medIssues * 0.8;
  const formatting_score = Math.max(0.5, Number((WEIGHTS.FORMATTING - formatPenalty).toFixed(1)));

  // 3. Contact Information Points (max: 5)
  let contactPoints = 0.0;
  if (contactInfo.email_detected) contactPoints += 2.0;
  if (contactInfo.phone_detected) contactPoints += 1.5;
  if (contactInfo.name_detected) contactPoints += 0.5;
  if (contactInfo.linkedin_detected) contactPoints += 0.5;
  if (contactInfo.github_detected || contactInfo.portfolio_detected) contactPoints += 0.5;
  const contact_score = Math.min(WEIGHTS.CONTACT, Number(contactPoints.toFixed(1)));

  let keyword_score = 0.0;
  let required_skills_score = 0.0;
  let semantic_score = 0.0;

  if (hasJd) {
    // 4. Keyword Match (max: 35)
    const coverageRatio = keywordResult.coverage_ratio || 0.0;
    keyword_score = Number((coverageRatio * WEIGHTS.KEYWORD_MATCH).toFixed(1));

    // 5. Required Skills (max: 20)
    const missingSkills = keywordResult.missing_skills || [];
    const reqMissing = missingSkills.filter((s) => s.importance === 'required');
    const totalTargets = Math.max(1, keywordResult.total_target_count || 1);
    const reqCoverage = Math.max(0.0, 1.0 - reqMissing.length / totalTargets);
    required_skills_score = Number((reqCoverage * WEIGHTS.REQUIRED_SKILLS).toFixed(1));

    // 6. Content Relevance (max: 25)
    const relScore = relevanceResult.semantic_score || 70;
    semantic_score = Number(((relScore / 100.0) * WEIGHTS.CONTENT_RELEVANCE).toFixed(1));
  } else {
    // Baseline evaluation when no specific Job Description is supplied
    const matchedCount = keywordResult.matched_count || 0;
    const skillsRatio = Math.min(1.0, matchedCount / 10.0);

    keyword_score = Number((skillsRatio * WEIGHTS.KEYWORD_MATCH).toFixed(1));
    required_skills_score = Number((skillsRatio * WEIGHTS.REQUIRED_SKILLS).toFixed(1));

    const relScore = relevanceResult.semantic_score || 75;
    semantic_score = Number(((relScore / 100.0) * WEIGHTS.CONTENT_RELEVANCE).toFixed(1));
  }

  const rawTotal = structure_score + formatting_score + contact_score + keyword_score + required_skills_score + semantic_score;
  const total_score = Math.max(20, Math.min(99, Math.round(rawTotal)));

  let score_grade = 'Needs Significant Optimization';
  if (total_score >= 88) {
    score_grade = 'Excellent';
  } else if (total_score >= 75) {
    score_grade = 'Good';
  } else if (total_score >= 60) {
    score_grade = 'Needs Work';
  }

  // Generate deterministic actionable recommendations
  const recommendations = [];
  let recCounter = 1;

  // Rec 1: Missing critical skills
  const missingSkillsList = keywordResult.missing_skills || [];
  if (missingSkillsList.length > 0) {
    const topMissing = missingSkillsList.slice(0, 3).map((s) => s.skill);
    const hasCritical = missingSkillsList.slice(0, 3).some((s) => s.importance === 'required');
    recommendations.push({
      id: `rec-${recCounter++}`,
      category: 'Skills & Keywords',
      title: `Include missing target technologies: ${topMissing.join(', ')}`,
      guidance: 'If you possess genuine experience with these technologies, mention them explicitly in your skills list and relevant project descriptions.',
      example: `Example: 'Developed production services utilizing ${topMissing[0]} with automated CI/CD.'`,
      severity: hasCritical ? 'critical' : 'info'
    });
  }

  // Rec 2: Measurable impact metrics in bullets
  const expHighlights = experienceResult.improvement_highlights || [];
  if (expHighlights.length > 0) {
    const targetBullet = expHighlights[0];
    recommendations.push({
      id: `rec-${recCounter++}`,
      category: 'Experience Impact',
      title: 'Add measurable business outcomes and metrics to experience bullets',
      guidance: targetBullet.guidance || 'Quantify your achievements with numbers, percentages, or scale handled.',
      example: `Current: "${targetBullet.bullet.slice(0, 65)}..."\nGuidance: Mention what you engineered, the technologies used, and the measurable outcome (e.g., 'reduced API latency by 35%').`,
      severity: 'warning'
    });
  }

  // Rec 3: Multi-column or layout issues
  if (parsedDoc.hasTwoColumns) {
    recommendations.push({
      id: `rec-${recCounter++}`,
      category: 'Formatting & Layout',
      title: 'Adopt a clean single-column ATS layout',
      guidance: 'Two-column resumes often get parsed out of chronological order by older enterprise applicant tracking systems.',
      example: 'Use a standard top-to-bottom layout with single-column text blocks for optimal scanning accuracy.',
      severity: 'warning'
    });
  }

  // Rec 4: Missing profile links
  if (!contactInfo.linkedin_detected || !contactInfo.github_detected) {
    const missingLinks = [];
    if (!contactInfo.linkedin_detected) missingLinks.push('LinkedIn');
    if (!contactInfo.github_detected) missingLinks.push('GitHub');
    recommendations.push({
      id: `rec-${recCounter++}`,
      category: 'Profile Links',
      title: `Add direct ${missingLinks.join(' and ')} links in your header`,
      guidance: 'Hiring managers and recruiters in engineering prioritize candidates with verified code samples and professional profiles.',
      severity: 'info'
    });
  }

  // Rec 5: Missing projects section
  const missingSections = sectionInfo.missing_sections || [];
  if (missingSections.includes('projects')) {
    recommendations.push({
      id: `rec-${recCounter++}`,
      category: 'Structure',
      title: "Add a dedicated 'Projects' section",
      guidance: 'Highlighting 2-3 real-world, deployed projects with tech stack and live links dramatically improves candidate ranking.',
      severity: 'info'
    });
  }

  const metrics = {
    parse_rate: parsedDoc.scannedImageSuspected ? 45 : 98,
    keyword_match: Math.round((keywordResult.coverage_ratio || 0.85) * 100),
    content_quality: Math.min(100, Math.max(50, total_score + 5)),
    impact_score: experienceResult.impact_score || 85,
    ats_compatibility: total_score
  };

  const categories = {
    keyword_match: keyword_score,
    semantic_relevance: semantic_score,
    required_skills: required_skills_score,
    structure: structure_score,
    formatting: formatting_score,
    contact: contact_score
  };

  return {
    score: total_score,
    score_grade,
    categories,
    metrics,
    recommendations: recommendations.slice(0, 5)
  };
}
