/**
 * Deterministic Content Relevance Engine.
 * Replaces heavy AI neural embeddings with rule-based N-Gram / Token Set alignment.
 * 100% offline, deterministic, and instant without any AI models or hallucinations.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
  'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'did', 'do',
  'does', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves'
]);

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9#+.]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function computeOverlapScore(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let matches = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      matches++;
    }
  }
  // Dice coefficient
  return (2 * matches) / (setA.size + setB.size);
}

export function matchContentRelevance(resumeSections, experienceBullets, jdAnalysis) {
  if (!jdAnalysis || !jdAnalysis.has_jd) {
    // Internal coherence calculation for resume without specific JD
    const resumeText = Object.values(resumeSections).join(' ');
    const resumeTokens = tokenize(resumeText);
    const expTokens = tokenize(experienceBullets.join(' '));

    const coherence = computeOverlapScore(resumeTokens, expTokens);
    const baseScore = Math.max(70, Math.min(95, Math.round(50 + coherence * 55)));

    return {
      overall_similarity: Number((baseScore / 100).toFixed(2)),
      semantic_score: baseScore,
      experience_relevance_score: baseScore,
      strong_alignments: [],
      unmatched_requirements: []
    };
  }

  // Construct target requirements from JD
  const jobTargets = [];
  for (const resp of jdAnalysis.responsibilities || []) {
    if (resp.length > 15) {
      jobTargets.push(resp);
    }
  }
  for (const req of jdAnalysis.required_skills || []) {
    jobTargets.push(`Hands-on experience with ${req}`);
  }

  if (jobTargets.length === 0) {
    const rawSentences = (jdAnalysis.raw_text || '')
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    jobTargets.push(...rawSentences.slice(0, 6));
  }

  // Candidate resume chunks
  const resumeChunks = [];
  for (const b of experienceBullets) {
    if (b.length > 15) resumeChunks.push(b);
  }
  if (resumeSections.projects) {
    const projLines = resumeSections.projects.split(/\r?\n/).filter((l) => l.trim().length > 20);
    resumeChunks.push(...projLines.slice(0, 6));
  }
  if (resumeChunks.length === 0) {
    for (const [secName, text] of Object.entries(resumeSections)) {
      if (secName !== 'header') {
        const secLines = text.split(/\r?\n/).filter((l) => l.trim().length > 20);
        resumeChunks.push(...secLines.slice(0, 6));
      }
    }
  }

  if (resumeChunks.length === 0 || jobTargets.length === 0) {
    return {
      overall_similarity: 0.70,
      semantic_score: 70,
      experience_relevance_score: 70,
      strong_alignments: [],
      unmatched_requirements: []
    };
  }

  const chunkTokens = resumeChunks.map(tokenize);
  const targetScores = [];
  const strong_alignments = [];
  const unmatched_requirements = [];

  for (const target of jobTargets) {
    const tTokens = tokenize(target);
    let bestScore = 0;
    let bestChunkIndex = -1;

    for (let cIdx = 0; cIdx < chunkTokens.length; cIdx++) {
      const score = computeOverlapScore(tTokens, chunkTokens[cIdx]);
      if (score > bestScore) {
        bestScore = score;
        bestChunkIndex = cIdx;
      }
    }

    targetScores.push(bestScore);

    if (bestScore >= 0.28 && bestChunkIndex !== -1) {
      strong_alignments.push({
        job_aspect: target.slice(0, 80),
        resume_evidence: resumeChunks[bestChunkIndex].slice(0, 100),
        similarity: Number(Math.min(0.98, bestScore + 0.5).toFixed(2))
      });
    } else {
      unmatched_requirements.push(target.slice(0, 90));
    }
  }

  const avgScore = targetScores.length > 0
    ? targetScores.reduce((acc, s) => acc + s, 0) / targetScores.length
    : 0.4;

  // Scale score to ATS industry standards (typically 50 - 95%)
  const scaledScore = Math.max(40, Math.min(96, Math.round(55 + avgScore * 80)));

  return {
    overall_similarity: Number((scaledScore / 100).toFixed(2)),
    semantic_score: scaledScore,
    experience_relevance_score: scaledScore,
    strong_alignments: strong_alignments.slice(0, 4),
    unmatched_requirements: unmatched_requirements.slice(0, 4)
  };
}
