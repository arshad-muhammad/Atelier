"""Experience Section and Bullet Point Analyzer."""
import re
from typing import Dict, Any, List, Tuple

ACTION_VERBS = {
    "architected", "built", "engineered", "designed", "developed", "implemented",
    "deployed", "optimized", "scaled", "created", "automated", "reduced",
    "increased", "spearheaded", "orchestrated", "refactored", "migrated",
    "integrated", "established", "led", "mentored", "maintained", "managed"
}

WEAK_STARTERS = {
    "worked on", "responsible for", "helped with", "assisted with", "participated in",
    "handled", "tasked with", "involved in", "did"
}

METRIC_PATTERNS = [
    r"\b\d+%",                          # 30%
    r"\b\d+x\b",                        # 2x, 10x
    r"\$\d+[\d,]*",                     # $10,000
    r"\b\d+[\d,]*\s*(?:users|clients|requests|ms|seconds|minutes|hours|gb|tb|mb)", # 10,000 users, 200ms
    r"\b(?:reduced|increased|improved|saved)\s+by\s+\d+" # reduced by 40
]

class ExperienceAnalyzer:
    """Analyzes bullet points for impact, metrics, action verbs, and actionable guidance."""

    @staticmethod
    def extract_bullets(experience_text: str) -> List[str]:
        """Extracts individual bullet points or achievement sentences."""
        if not experience_text:
            return []

        lines = [l.strip() for l in experience_text.splitlines() if l.strip()]
        bullets: List[str] = []

        for line in lines:
            # Check if starts with bullet character
            cleaned = re.sub(r"^[•\-\*\>—\d+\.]+\s*", "", line).strip()
            if len(cleaned) > 20:
                bullets.append(cleaned)

        return bullets

    @classmethod
    def evaluate_bullet(cls, bullet: str) -> Dict[str, Any]:
        """Evaluates a single bullet point and suggests deterministic improvements."""
        bullet_lower = bullet.lower()
        first_few_words = " ".join(bullet_lower.split()[:3])

        # Check for weak starter
        has_weak_starter = any(starter in first_few_words for starter in WEAK_STARTERS)

        # Check for strong action verb
        has_action_verb = any(bullet_lower.startswith(v) or f" {v} " in bullet_lower for v in ACTION_VERBS)

        # Check for measurable metrics
        has_metric = any(re.search(pat, bullet_lower) for pat in METRIC_PATTERNS)

        guidance = None
        if has_weak_starter:
            guidance = "Replace passive phrasing (e.g., 'worked on') with an assertive action verb such as 'Architected', 'Engineered', or 'Optimized'."
        elif not has_metric:
            guidance = "Consider adding measurable outcomes to this bullet (e.g., latency reduction, scale handled, or efficiency gain)."

        return {
            "bullet": bullet,
            "has_action_verb": has_action_verb,
            "has_metric": has_metric,
            "has_weak_starter": has_weak_starter,
            "guidance": guidance
        }

    @classmethod
    def analyze(cls, experience_text: str) -> Dict[str, Any]:
        """Analyzes experience section and aggregates bullet health metrics."""
        bullets = cls.extract_bullets(experience_text)
        evaluated = [cls.evaluate_bullet(b) for b in bullets]

        action_verb_count = sum(1 for e in evaluated if e["has_action_verb"])
        metric_count = sum(1 for e in evaluated if e["has_metric"])
        weak_count = sum(1 for e in evaluated if e["has_weak_starter"])

        total_bullets = max(1, len(evaluated))
        impact_score = int(round(
            ((action_verb_count / total_bullets) * 0.5 + (metric_count / total_bullets) * 0.5) * 100
        ))

        # Select up to 3 bullets needing guidance
        improvement_highlights = [e for e in evaluated if e["guidance"] is not None][:3]

        return {
            "total_bullets": len(evaluated),
            "action_verb_count": action_verb_count,
            "metric_count": metric_count,
            "weak_count": weak_count,
            "impact_score": max(30, min(100, impact_score)),
            "improvement_highlights": improvement_highlights
        }
