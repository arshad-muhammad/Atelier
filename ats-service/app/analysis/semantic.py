"""Semantic Matching Engine using local BGE embeddings."""
import logging
from typing import Dict, Any, List, Tuple
import numpy as np

from ..services.embedding_service import EmbeddingService

logger = logging.getLogger("ats.semantic")

class SemanticMatcher:
    """Computes fine-grained chunk-level semantic similarity using BGE embeddings."""

    def __init__(self):
        self.embedding_service = EmbeddingService.get_instance()

    def match(
        self,
        resume_sections: Dict[str, str],
        experience_bullets: List[str],
        jd_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculates semantic relevance between resume chunks and job requirements."""
        if not jd_analysis.get("has_jd", False):
            # No Job Description provided: compute internal resume coherence
            return self._compute_internal_coherence(resume_sections, experience_bullets)

        responsibilities = jd_analysis.get("responsibilities", [])
        required_skills = jd_analysis.get("required_skills", [])

        # Build job targets from responsibilities and required skills
        job_targets: List[str] = []
        for r in responsibilities:
            if len(r.strip()) > 15:
                job_targets.append(r.strip())
        for s in required_skills:
            job_targets.append(f"Hands-on experience with {s}")

        if not job_targets:
            # Fallback if JD didn't yield clean bullets
            jd_text = jd_analysis.get("raw_text", "")
            sentences = [s.strip() for s in jd_text.split(".") if len(s.strip()) > 20]
            job_targets = sentences[:8]

        # Build resume candidate chunks
        resume_chunks: List[str] = []
        for b in experience_bullets:
            if len(b.strip()) > 15:
                resume_chunks.append(b.strip())

        # Also add projects and skills overview if available
        if "projects" in resume_sections:
            proj_lines = [l.strip() for l in resume_sections["projects"].splitlines() if len(l.strip()) > 20]
            resume_chunks.extend(proj_lines[:6])

        if not resume_chunks:
            # Fallback to summary or whatever text exists
            for sec_name, content in resume_sections.items():
                if sec_name != "header":
                    lines = [l.strip() for l in content.splitlines() if len(l.strip()) > 20]
                    resume_chunks.extend(lines[:8])

        if not resume_chunks or not job_targets:
            return {
                "overall_similarity": 0.70,
                "semantic_score": 70,
                "experience_relevance_score": 70,
                "strong_alignments": [],
                "unmatched_requirements": []
            }

        try:
            # Batch encode chunks using BGE
            resume_vecs = self.embedding_service.get_batch_embeddings(resume_chunks)
            job_vecs = self.embedding_service.get_batch_embeddings(job_targets)

            # Compute similarity matrix
            # shape: (len(job_targets), len(resume_chunks))
            sim_matrix = np.zeros((len(job_targets), len(resume_chunks)), dtype=np.float32)
            for j_idx, j_vec in enumerate(job_vecs):
                for r_idx, r_vec in enumerate(resume_vecs):
                    sim_matrix[j_idx, r_idx] = self.embedding_service.cosine_similarity(j_vec, r_vec)

            # For each job target, find maximum matching resume chunk
            max_sims_per_job = np.max(sim_matrix, axis=1)
            mean_similarity = float(np.mean(max_sims_per_job))

            # Identify strong alignments
            strong_alignments: List[Dict[str, Any]] = []
            unmatched_requirements: List[str] = []

            for j_idx, target in enumerate(job_targets):
                best_r_idx = int(np.argmax(sim_matrix[j_idx]))
                best_score = float(max_sims_per_job[j_idx])

                if best_score >= 0.68:
                    strong_alignments.append({
                        "job_aspect": target[:80],
                        "resume_evidence": resume_chunks[best_r_idx][:100],
                        "similarity": round(best_score, 2)
                    })
                elif best_score < 0.55:
                    unmatched_requirements.append(target[:90])

            # Scale to 0-100
            # BGE cosine similarities for relevant passages generally range 0.5 to 0.85
            # Min baseline 0.35, max 0.85
            normalized_score = (mean_similarity - 0.35) / (0.85 - 0.35)
            semantic_score = int(round(max(40, min(98, normalized_score * 100))))
            experience_relevance_score = int(round(max(45, min(96, (mean_similarity / 0.85) * 90))))

            return {
                "overall_similarity": round(mean_similarity, 3),
                "semantic_score": semantic_score,
                "experience_relevance_score": experience_relevance_score,
                "strong_alignments": strong_alignments[:4],
                "unmatched_requirements": unmatched_requirements[:3]
            }

        except Exception as e:
            logger.error(f"Semantic matching fallback triggered: {e}")
            return {
                "overall_similarity": 0.72,
                "semantic_score": 72,
                "experience_relevance_score": 72,
                "strong_alignments": [],
                "unmatched_requirements": []
            }

    def _compute_internal_coherence(
        self,
        resume_sections: Dict[str, str],
        experience_bullets: List[str]
    ) -> Dict[str, Any]:
        """Computes internal semantic coherence when no job description is supplied."""
        skills_text = resume_sections.get("skills", "")
        if not skills_text or not experience_bullets:
            return {
                "overall_similarity": 0.75,
                "semantic_score": 75,
                "experience_relevance_score": 75,
                "strong_alignments": [],
                "unmatched_requirements": []
            }

        try:
            skill_vec = self.embedding_service.get_embedding(skills_text[:500])
            bullet_vecs = self.embedding_service.get_batch_embeddings(experience_bullets[:6])

            sims = [self.embedding_service.cosine_similarity(skill_vec, bv) for bv in bullet_vecs]
            avg_sim = float(np.mean(sims)) if sims else 0.70

            normalized = (avg_sim - 0.30) / (0.80 - 0.30)
            score = int(round(max(50, min(95, normalized * 100))))

            return {
                "overall_similarity": round(avg_sim, 3),
                "semantic_score": score,
                "experience_relevance_score": score,
                "strong_alignments": [],
                "unmatched_requirements": []
            }
        except Exception:
            return {
                "overall_similarity": 0.75,
                "semantic_score": 75,
                "experience_relevance_score": 75,
                "strong_alignments": [],
                "unmatched_requirements": []
            }
