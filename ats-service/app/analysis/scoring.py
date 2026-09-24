"""Explainable Scoring Engine for Atelier Resume Compatibility Score."""
from typing import Dict, Any, List, Tuple
from ..config import settings
from ..models.schemas import CategoryScores, Recommendation, LiveMetrics, ATSIssue

class ScoringEngine:
    """Calculates deterministic, transparent, and explainable ATS compatibility scores."""

    @classmethod
    def calculate(
        cls,
        parsed_doc: Dict[str, Any],
        contact_info: Dict[str, Any],
        section_info: Dict[str, Any],
        keyword_result: Dict[str, Any],
        semantic_result: Dict[str, Any],
        experience_result: Dict[str, Any],
        ats_issues: List[ATSIssue],
        has_jd: bool
    ) -> Dict[str, Any]:
        """Calculates category scores, overall score, and explainable recommendations."""
        # 1. Structure Points (max: settings.WEIGHT_STRUCTURE = 10)
        # Presence of essential sections: experience, education, skills
        present_sections = section_info.get("present_sections", [])
        struct_ratio = 0.0
        if "experience" in present_sections:
            struct_ratio += 0.45
        if "skills" in present_sections:
            struct_ratio += 0.35
        if "education" in present_sections:
            struct_ratio += 0.20
        if section_info.get("is_order_good", True):
            struct_ratio = min(1.0, struct_ratio)
        else:
            struct_ratio = max(0.2, struct_ratio - 0.2)
        structure_score = round(struct_ratio * settings.WEIGHT_STRUCTURE, 1)

        # 2. Formatting Points (max: settings.WEIGHT_FORMATTING = 5)
        # Deduct based on severity of ATS issues
        high_issues = sum(1 for i in ats_issues if i.severity == "HIGH")
        med_issues = sum(1 for i in ats_issues if i.severity == "MEDIUM")
        format_penalty = (high_issues * 2.0) + (med_issues * 0.8)
        formatting_score = max(0.5, round(settings.WEIGHT_FORMATTING - format_penalty, 1))

        # 3. Contact Information Points (max: settings.WEIGHT_CONTACT = 5)
        contact_points = 0.0
        if contact_info.get("email_detected", False):
            contact_points += 2.0
        if contact_info.get("phone_detected", False):
            contact_points += 1.5
        if contact_info.get("name_detected", False):
            contact_points += 0.5
        if contact_info.get("linkedin_detected", False):
            contact_points += 0.5
        if contact_info.get("github_detected", False) or contact_info.get("portfolio_detected", False):
            contact_points += 0.5
        contact_score = min(settings.WEIGHT_CONTACT, round(contact_points, 1))

        if has_jd:
            # 4. Keyword Match (max: settings.WEIGHT_KEYWORD_MATCH = 35)
            coverage_ratio = keyword_result.get("coverage_ratio", 0.0)
            keyword_score = round(coverage_ratio * settings.WEIGHT_KEYWORD_MATCH, 1)

            # 5. Required Skills (max: settings.WEIGHT_REQUIRED_SKILLS = 20)
            missing_skills = keyword_result.get("missing_skills", [])
            req_missing = [s for s in missing_skills if s.importance == "required"]
            total_req = keyword_result.get("total_target_count", 1)
            req_coverage = max(0.0, 1.0 - (len(req_missing) / max(1, total_req)))
            required_skills_score = round(req_coverage * settings.WEIGHT_REQUIRED_SKILLS, 1)

            # 6. Semantic Relevance (max: settings.WEIGHT_SEMANTIC_RELEVANCE = 25)
            sem_score_raw = semantic_result.get("semantic_score", 70)
            semantic_score = round((sem_score_raw / 100.0) * settings.WEIGHT_SEMANTIC_RELEVANCE, 1)
        else:
            # When no JD is provided, scale based on skills inventory and experience depth
            matched_count = keyword_result.get("matched_count", 0)
            # Having 8-12 solid verified skills gives full points
            skills_ratio = min(1.0, matched_count / 10.0)
            keyword_score = round(skills_ratio * settings.WEIGHT_KEYWORD_MATCH, 1)
            required_skills_score = round(skills_ratio * settings.WEIGHT_REQUIRED_SKILLS, 1)

            # Semantic coherence of resume
            sem_score_raw = semantic_result.get("semantic_score", 75)
            semantic_score = round((sem_score_raw / 100.0) * settings.WEIGHT_SEMANTIC_RELEVANCE, 1)

        total_score = int(round(
            structure_score + formatting_score + contact_score +
            keyword_score + required_skills_score + semantic_score
        ))
        total_score = max(20, min(99, total_score))

        # Grade title
        if total_score >= 88:
            score_grade = "Excellent"
        elif total_score >= 75:
            score_grade = "Good"
        elif total_score >= 60:
            score_grade = "Needs Work"
        else:
            score_grade = "Needs Significant Optimization"

        # Generate Actionable Recommendations (Deterministic)
        recommendations: List[Recommendation] = []
        rec_counter = 1

        # Recommendation 1: Missing skills
        missing_skills_list = keyword_result.get("missing_skills", [])
        if missing_skills_list:
            top_missing = [s.skill for s in missing_skills_list[:3]]
            recommendations.append(Recommendation(
                id=f"rec-{rec_counter}",
                category="Skills & Keywords",
                title=f"Include missing target technologies: {', '.join(top_missing)}",
                guidance="If you have authentic experience with these technologies, mention them explicitly in your skills list and relevant project descriptions.",
                example=f"Example: 'Developed full-stack features utilizing {top_missing[0]} and cloud integrations.'",
                severity="critical" if any(s.importance == "required" for s in missing_skills_list[:3]) else "info"
            ))
            rec_counter += 1

        # Recommendation 2: Bullet Measurable Outcomes
        exp_highlights = experience_result.get("improvement_highlights", [])
        if exp_highlights:
            target_bullet = exp_highlights[0]
            recommendations.append(Recommendation(
                id=f"rec-{rec_counter}",
                category="Experience Impact",
                title="Add measurable business outcomes and metrics to experience bullets",
                guidance=target_bullet.get("guidance", "Quantify your achievements with numbers, percentages, or scale."),
                example=f"Current: \"{target_bullet['bullet'][:70]}...\"\nGuidance: Mention what you built, the tool used, and the measurable impact (e.g., 'reduced load time by 35%').",
                severity="warning"
            ))
            rec_counter += 1

        # Recommendation 3: Formatting / Layout
        if parsed_doc.get("has_two_columns", False):
            recommendations.append(Recommendation(
                id=f"rec-{rec_counter}",
                category="Formatting & Layout",
                title="Adopt a single-column ATS layout",
                guidance="Two-column resumes often get parsed out of chronological order by older enterprise applicant tracking systems.",
                example="Use standard top-to-bottom layout with single-column text blocks for optimal scanning accuracy.",
                severity="warning"
            ))
            rec_counter += 1

        # Recommendation 4: Contact / Portfolio links
        if not contact_info.get("linkedin_detected", False) or not contact_info.get("github_detected", False):
            missing_links = []
            if not contact_info.get("linkedin_detected", False):
                missing_links.append("LinkedIn")
            if not contact_info.get("github_detected", False):
                missing_links.append("GitHub")
            recommendations.append(Recommendation(
                id=f"rec-{rec_counter}",
                category="Profile Links",
                title=f"Add direct {', '.join(missing_links)} links in your header",
                guidance="Recruiters and hiring managers in tech prioritize candidates with verified code samples and active profiles.",
                severity="info"
            ))
            rec_counter += 1

        # Recommendation 5: Section headers
        missing_secs = section_info.get("missing_sections", [])
        if "projects" in missing_secs:
            recommendations.append(Recommendation(
                id=f"rec-{rec_counter}",
                category="Structure",
                title="Add a dedicated 'Projects' section",
                guidance="Highlighting 2-3 real-world, deployed projects with tech stack and live links dramatically improves candidate ranking.",
                severity="info"
            ))
            rec_counter += 1

        # Live Metrics derivation
        metrics = LiveMetrics(
            parse_rate=98 if not parsed_doc.get("scanned_image_suspected", False) else 45,
            keyword_match=int(round(keyword_result.get("coverage_ratio", 0.85) * 100)),
            content_quality=int(round(min(100, max(50, total_score + 5)))),
            impact_score=experience_result.get("impact_score", 88),
            ats_compatibility=total_score
        )

        categories = CategoryScores(
            keyword_match=keyword_score,
            semantic_relevance=semantic_score,
            required_skills=required_skills_score,
            structure=structure_score,
            formatting=formatting_score,
            contact=contact_score
        )

        return {
            "score": total_score,
            "score_grade": score_grade,
            "categories": categories,
            "metrics": metrics,
            "recommendations": recommendations[:5]
        }
