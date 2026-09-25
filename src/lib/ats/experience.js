/**
 * Experience Section and Bullet Point Analyzer.
 * Deterministic analysis of bullet points for action verbs, measurable metrics, and impact.
 */

const ACTION_VERBS = new Set([
  'architected', 'built', 'engineered', 'designed', 'developed', 'implemented',
  'deployed', 'optimized', 'scaled', 'created', 'automated', 'reduced',
  'increased', 'spearheaded', 'orchestrated', 'refactored', 'migrated',
  'integrated', 'established', 'led', 'mentored', 'maintained', 'managed',
  'delivered', 'programmed', 'authored', 'streamlined', 'resolved'
]);

const WEAK_STARTERS = [
  'worked on', 'responsible for', 'helped with', 'assisted with', 'participated in',
  'handled', 'tasked with', 'involved in', 'did', 'assisted in', 'helped to'
];

const METRIC_PATTERNS = [
  /\b\d+%/i,                                                    // 30%
  /\b\d+x\b/i,                                                  // 2x, 10x
  /\$\d+[\d,]*/i,                                               // $10,000
  /\b\d+[\d,]*\s*(?:users|clients|customers|requests|ms|seconds|minutes|hours|gb|tb|mb|qps|rps)\b/i,
  /\b\d+k\b/i,                                                  // 50k
  /\b(?:reduced|increased|improved|saved|boosted)\s+by\s+\d+/i  // reduced by 40
];

export function extractBullets(experienceText) {
  if (!experienceText) return [];
  const lines = experienceText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bullets = [];

  for (const line of lines) {
    const cleaned = line.replace(/^[•\-*>—\d+.]+\s*/, '').trim();
    if (cleaned.length > 20) {
      bullets.push(cleaned);
    }
  }

  return bullets;
}

export function evaluateBullet(bullet) {
  const bulletLower = bullet.toLowerCase();
  const firstFewWords = bulletLower.split(/\s+/).slice(0, 3).join(' ');

  const hasWeakStarter = WEAK_STARTERS.some((starter) => firstFewWords.includes(starter));
  const words = bulletLower.split(/\s+/);
  const hasActionVerb = words.some((w) => ACTION_VERBS.has(w.replace(/[^a-z]/g, '')));
  const hasMetric = METRIC_PATTERNS.some((pat) => pat.test(bulletLower));

  let guidance = null;
  if (hasWeakStarter) {
    guidance = "Replace passive phrasing (e.g., 'worked on') with an assertive action verb such as 'Architected', 'Engineered', or 'Optimized'.";
  } else if (!hasMetric) {
    guidance = "Consider adding measurable outcomes to this bullet (e.g., latency reduction %, scale handled, or user count).";
  }

  return {
    bullet,
    has_action_verb: hasActionVerb,
    has_metric: hasMetric,
    has_weak_starter: hasWeakStarter,
    guidance
  };
}

export function analyzeExperience(experienceText) {
  const bullets = extractBullets(experienceText);
  const evaluated = bullets.map(evaluateBullet);

  const action_verb_count = evaluated.filter((e) => e.has_action_verb).length;
  const metric_count = evaluated.filter((e) => e.has_metric).length;
  const weak_count = evaluated.filter((e) => e.has_weak_starter).length;

  const total_bullets = Math.max(1, evaluated.length);
  const rawImpact = ((action_verb_count / total_bullets) * 0.5 + (metric_count / total_bullets) * 0.5) * 100;
  const impact_score = Math.max(30, Math.min(100, Math.round(rawImpact)));

  const improvement_highlights = evaluated.filter((e) => e.guidance !== null).slice(0, 3);

  return {
    total_bullets: evaluated.length,
    action_verb_count,
    metric_count,
    weak_count,
    impact_score,
    improvement_highlights
  };
}
