import {
  ALIAS_TO_CANONICAL,
  SKILL_TO_CATEGORY,
  getCanonical,
  getCategory,
  areRelated
} from './taxonomy.js';

/**
 * Deterministic Multi-tier Keyword and Skill Extraction Engine.
 */

// Pre-sorted list of terms by length descending to prioritize multi-word matches
const ALL_TERMS = Array.from(
  new Set([...Object.keys(ALIAS_TO_CANONICAL), ...Object.keys(SKILL_TO_CATEGORY)])
).sort((a, b) => b.length - a.length);

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSkillsFromText(text) {
  if (!text) return {};
  const textLower = text.toLowerCase();
  const detected = {};

  for (const term of ALL_TERMS) {
    const escaped = escapeRegex(term);
    let regex;

    // Special characters handling: c++, c#, .net
    if (['c++', 'c#', '.net'].includes(term)) {
      regex = new RegExp(`(?:^|\\s|[(\\[])${escaped}(?:$|\\s|[,;.:)\\]])`, 'gi');
    } else {
      regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    }

    const matches = textLower.match(regex);
    if (matches && matches.length > 0) {
      const canonical = getCanonical(term) || term;
      const category = getCategory(canonical);

      if (!detected[canonical]) {
        detected[canonical] = {
          found_term: term,
          canonical,
          category,
          count: matches.length
        };
      } else {
        detected[canonical].count += matches.length;
      }
    }
  }

  return detected;
}

export function parseJobDescription(jdText) {
  if (!jdText || !jdText.trim()) {
    return {
      has_jd: false,
      required_skills: [],
      preferred_skills: [],
      responsibilities: [],
      experience_requirement: null,
      education_requirement: null
    };
  }

  const lines = jdText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const requiredSet = new Set();
  const preferredSet = new Set();
  const responsibilities = [];

  let isPreferredMode = false;
  let isRequiredMode = false;
  let isRespMode = false;

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    if (/nice to have|preferred|bonus|good to have|plus/i.test(lineLower)) {
      isPreferredMode = true;
      isRequiredMode = false;
      isRespMode = false;
      continue;
    } else if (/required|requirements|must have|qualifications|what you need/i.test(lineLower)) {
      isRequiredMode = true;
      isPreferredMode = false;
      isRespMode = false;
      continue;
    } else if (/responsibilities|what you will do|role overview|duties/i.test(lineLower)) {
      isRespMode = true;
      isRequiredMode = false;
      isPreferredMode = false;
      continue;
    }

    const extracted = extractSkillsFromText(line);
    for (const canon of Object.keys(extracted)) {
      if (isPreferredMode) {
        preferredSet.add(canon);
      } else {
        requiredSet.add(canon);
      }
    }

    if (isRespMode && line.length > 20) {
      responsibilities.push(line.replace(/^[•\-* \t]+/, ''));
    }
  }

  // Fallback: if no section headers separated required vs preferred, treat all extracted skills as required
  if (requiredSet.size === 0 && preferredSet.size === 0) {
    const allFound = extractSkillsFromText(jdText);
    for (const c of Object.keys(allFound)) {
      requiredSet.add(c);
    }
  }

  const expMatch = jdText.match(/(\d+[\+]?(?:\s*-\s*\d+)?\s*(?:years|yrs)\s+(?:of\s+)?experience)/i);
  const experience_requirement = expMatch ? expMatch[1] : null;

  let education_requirement = null;
  const eduMatch = jdText.match(/([^.\n]*(?:bachelor|master|degree|computer science)[^.\n]*)/i);
  if (eduMatch) {
    education_requirement = eduMatch[1].trim();
  }

  return {
    has_jd: true,
    required_skills: Array.from(requiredSet),
    preferred_skills: Array.from(preferredSet),
    responsibilities: responsibilities.slice(0, 8),
    experience_requirement,
    education_requirement,
    raw_text: jdText
  };
}

export function matchKeywords(resumeSkills, jdAnalysis) {
  if (!jdAnalysis || !jdAnalysis.has_jd) {
    const matched = [];
    for (const [canon, data] of Object.entries(resumeSkills)) {
      matched.push({
        skill: data.found_term.charAt(0).toUpperCase() + data.found_term.slice(1),
        match_type: 'exact',
        canonical_name: canon,
        category: data.category
      });
    }
    return {
      matched_skills: matched,
      missing_skills: [],
      related_skills: [],
      coverage_ratio: 1.0,
      matched_count: matched.length,
      total_target_count: matched.length
    };
  }

  const requiredTargets = jdAnalysis.required_skills || [];
  const preferredTargets = jdAnalysis.preferred_skills || [];
  const allTargets = Array.from(new Set([...requiredTargets, ...preferredTargets]));

  const matchedSkills = [];
  const missingSkills = [];
  const relatedSkills = [];

  const resumeCanonicals = new Set(Object.keys(resumeSkills));

  for (const target of allTargets) {
    const targetCanonical = getCanonical(target) || target.toLowerCase();
    const targetCategory = getCategory(targetCanonical);
    const importance = requiredTargets.includes(target) ? 'required' : 'preferred';

    if (resumeCanonicals.has(targetCanonical)) {
      const data = resumeSkills[targetCanonical];
      const foundTerm = data.found_term;

      let matchType = 'exact';
      if (foundTerm.toLowerCase() === target.toLowerCase()) {
        matchType = 'exact';
      } else if (
        foundTerm.toLowerCase().replace(/[.\s]/g, '') === target.toLowerCase().replace(/[.\s]/g, '')
      ) {
        matchType = 'normalized';
      } else {
        matchType = 'synonym';
      }

      matchedSkills.push({
        skill: foundTerm.charAt(0).toUpperCase() + foundTerm.slice(1),
        match_type: matchType,
        canonical_name: targetCanonical,
        category: targetCategory
      });
    } else {
      missingSkills.push({
        skill: target.charAt(0).toUpperCase() + target.slice(1),
        importance,
        category: targetCategory
      });

      // Find related technologies in resume within same category
      for (const rCanon of resumeCanonicals) {
        if (areRelated(targetCanonical, rCanon)) {
          const relTerm = resumeSkills[rCanon].found_term;
          const capitalizedRel = relTerm.charAt(0).toUpperCase() + relTerm.slice(1);
          const capitalizedTarget = target.charAt(0).toUpperCase() + target.slice(1);
          const relInfo = `${capitalizedRel} (related ${targetCategory} skill for ${capitalizedTarget})`;
          if (!relatedSkills.includes(relInfo)) {
            relatedSkills.push(relInfo);
          }
        }
      }
    }
  }

  const totalTargets = Math.max(1, allTargets.length);
  const matchedCount = matchedSkills.length;
  const coverageRatio = Math.min(1.0, matchedCount / totalTargets);

  return {
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    related_skills: relatedSkills.slice(0, 6),
    coverage_ratio: Number(coverageRatio.toFixed(2)),
    matched_count: matchedCount,
    total_target_count: totalTargets
  };
}
