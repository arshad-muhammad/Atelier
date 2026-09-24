"""Multi-level Keyword Matching Engine."""
from typing import Dict, Any, List, Set, Tuple
from ..models.schemas import MatchedSkill, MissingSkill
from .skills import SkillTaxonomy

class KeywordMatcher:
    """Matches job requirements against resume skills across multiple precision tiers."""

    def __init__(self):
        self.taxonomy = SkillTaxonomy.get_instance()

    def match(
        self,
        resume_skills: Dict[str, Dict[str, Any]],
        jd_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Performs multi-level matching between resume skills and job requirements."""
        if not jd_analysis.get("has_jd", False):
            # If no JD is provided, treat detected resume skills as matched inventory
            matched: List[MatchedSkill] = []
            for canon, data in resume_skills.items():
                matched.append(MatchedSkill(
                    skill=data["found_term"].capitalize(),
                    match_type="exact",
                    canonical_name=canon,
                    category=data["category"]
                ))
            return {
                "matched_skills": matched,
                "missing_skills": [],
                "related_skills": [],
                "coverage_ratio": 1.0,
                "matched_count": len(matched),
                "total_target_count": len(matched),
            }

        required_targets = jd_analysis.get("required_skills", [])
        preferred_targets = jd_analysis.get("preferred_skills", [])
        all_targets = list(set(required_targets + preferred_targets))

        matched_skills: List[MatchedSkill] = []
        missing_skills: List[MissingSkill] = []
        related_skills: List[str] = []

        resume_canonicals = set(resume_skills.keys())

        # Check each target skill in the job description
        for target in all_targets:
            target_canonical = self.taxonomy.get_canonical(target) or target.lower()
            target_category = self.taxonomy.get_category(target_canonical)
            importance = "required" if target in required_targets else "preferred"

            # 1. Exact canonical or direct match
            if target_canonical in resume_canonicals:
                data = resume_skills[target_canonical]
                found_term = data["found_term"]

                # Distinguish exact text vs synonym match
                if found_term.lower() == target.lower():
                    m_type = "exact"
                elif found_term.lower().replace(".", "").replace(" ", "") == target.lower().replace(".", "").replace(" ", ""):
                    m_type = "normalized"
                else:
                    m_type = "synonym"

                matched_skills.append(MatchedSkill(
                    skill=found_term.capitalize(),
                    match_type=m_type,
                    canonical_name=target_canonical,
                    category=target_category
                ))
            else:
                # Skill is missing from resume
                missing_skills.append(MissingSkill(
                    skill=target.capitalize(),
                    importance=importance,
                    category=target_category
                ))

                # Check if candidate has a related technology in the same category
                # E.g. job wants React, candidate has Vue
                for r_canon in resume_canonicals:
                    if self.taxonomy.are_related(target_canonical, r_canon):
                        rel_info = f"{resume_skills[r_canon]['found_term'].capitalize()} (related {target_category} skill for {target.capitalize()})"
                        if rel_info not in related_skills:
                            related_skills.append(rel_info)

        total_targets = len(all_targets) if all_targets else 1
        matched_count = len(matched_skills)
        coverage_ratio = matched_count / total_targets

        return {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "related_skills": related_skills[:6],
            "coverage_ratio": round(coverage_ratio, 2),
            "matched_count": matched_count,
            "total_target_count": total_targets,
        }
