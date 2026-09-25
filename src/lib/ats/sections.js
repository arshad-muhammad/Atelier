/**
 * Resume section detection and structural analysis.
 * Identifies standard ATS sections and evaluates section hierarchy.
 */

export const SECTION_PATTERNS = {
  experience: [
    /^(work\s+)?experience/i,
    /^professional\s+experience/i,
    /^employment(\s+history)?/i,
    /^work\s+history/i,
    /^relevant\s+experience/i,
    /^career\s+history/i,
    /^internships?/i
  ],
  education: [
    /^education(al)?(\s+background)?/i,
    /^academic(\s+background|\s+history)?/i,
    /^academics?/i,
    /^qualifications?/i,
    /^degrees?/i
  ],
  skills: [
    /^(technical\s+|core\s+|key\s+)?skills/i,
    /^technologies(\s+and\s+tools)?/i,
    /^tools\s+(&|and)\s+technologies/i,
    /^core\s+competencies/i,
    /^technical\s+proficiencies?/i,
    /^skillset/i
  ],
  projects: [
    /^(key\s+|personal\s+|academic\s+|selected\s+|featured\s+)?projects/i,
    /^portfolio\s+projects/i,
    /^notable\s+work/i
  ],
  certifications: [
    /^(licenses\s+(&|and)\s+)?certifications?/i,
    /^certificates?/i,
    /^accreditations?/i,
    /^courses\s+(&|and)\s+certifications/i
  ],
  summary: [
    /^(professional\s+|career\s+|executive\s+)?summary/i,
    /^profile/i,
    /^about\s+me/i,
    /^(career\s+)?objective/i
  ]
};

export const STANDARD_CANONICALS = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'];

export function identifyHeading(line) {
  if (!line) return { isHeading: false, canonical: '' };
  const clean = line.replace(/[:\-_|•*#]+/g, ' ').trim().toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0 || words.length > 5 || clean.length > 45) {
    return { isHeading: false, canonical: '' };
  }

  for (const [canonical, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pat of patterns) {
      if (pat.test(clean)) {
        return { isHeading: true, canonical };
      }
    }
  }

  return { isHeading: false, canonical: '' };
}

export function segmentResume(fullText) {
  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections = { header: [] };
  const detectedOrder = [];
  let currentSection = 'header';

  for (const line of lines) {
    const { isHeading, canonical } = identifyHeading(line);
    if (isHeading) {
      currentSection = canonical;
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      if (!detectedOrder.includes(canonical)) {
        detectedOrder.push(canonical);
      }
    } else {
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(line);
    }
  }

  // Convert array of lines to joined string for each section
  const sectionTextMap = {};
  for (const [sec, secLines] of Object.entries(sections)) {
    sectionTextMap[sec] = secLines.join('\n');
  }

  const present_sections = detectedOrder.filter((s) => s in SECTION_PATTERNS);
  const missing_sections = STANDARD_CANONICALS.filter((s) => !present_sections.includes(s));

  // Determine section order health
  let is_order_good = true;
  // If summary appears, it should be near top
  const summaryIdx = detectedOrder.indexOf('summary');
  if (summaryIdx > 1) {
    is_order_good = false;
  }
  // Experience and Education should precede Certifications
  const expIdx = detectedOrder.indexOf('experience');
  const certIdx = detectedOrder.indexOf('certifications');
  if (expIdx !== -1 && certIdx !== -1 && certIdx < expIdx) {
    is_order_good = false;
  }

  return {
    sections: sectionTextMap,
    present_sections,
    missing_sections,
    detected_order: detectedOrder,
    is_order_good
  };
}
