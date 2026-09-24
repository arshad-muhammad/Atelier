"""Unit tests for scoring engine determinism and weighting."""
import pytest
from app.analysis.scoring import ScoringEngine
from app.models.schemas import ATSIssue

def test_scoring_determinism():
    parsed_doc = {"has_two_columns": False, "table_count": 0, "page_count": 1, "total_words": 350}
    contact_info = {
        "email_detected": True,
        "phone_detected": True,
        "name_detected": True,
        "linkedin_detected": True,
        "github_detected": True,
        "portfolio_detected": False
    }
    section_info = {
        "present_sections": ["experience", "skills", "education", "projects"],
        "is_order_good": True,
        "missing_sections": []
    }
    keyword_result = {
        "coverage_ratio": 0.85,
        "matched_count": 10,
        "total_target_count": 12,
        "missing_skills": []
    }
    semantic_result = {
        "semantic_score": 85,
        "overall_similarity": 0.78
    }
    experience_result = {
        "impact_score": 90,
        "improvement_highlights": []
    }
    ats_issues = [
        ATSIssue(issue="No portfolio URL", severity="LOW", explanation="Optional")
    ]

    scores = []
    for _ in range(5):
        res = ScoringEngine.calculate(
            parsed_doc=parsed_doc,
            contact_info=contact_info,
            section_info=section_info,
            keyword_result=keyword_result,
            semantic_result=semantic_result,
            experience_result=experience_result,
            ats_issues=ats_issues,
            has_jd=True
        )
        scores.append(res["score"])

    # Score MUST be deterministic
    assert len(set(scores)) == 1
    assert scores[0] >= 80

def test_scoring_without_job_description():
    parsed_doc = {"has_two_columns": False, "table_count": 0, "page_count": 1, "total_words": 300}
    contact_info = {
        "email_detected": True,
        "phone_detected": True,
        "name_detected": True,
        "linkedin_detected": True,
        "github_detected": True,
        "portfolio_detected": False
    }
    section_info = {
        "present_sections": ["experience", "skills", "education"],
        "is_order_good": True,
        "missing_sections": []
    }
    keyword_result = {
        "coverage_ratio": 1.0,
        "matched_count": 8,
        "total_target_count": 8,
        "missing_skills": []
    }
    semantic_result = {
        "semantic_score": 75,
        "overall_similarity": 0.72
    }
    experience_result = {
        "impact_score": 80,
        "improvement_highlights": []
    }
    ats_issues = []

    res = ScoringEngine.calculate(
        parsed_doc=parsed_doc,
        contact_info=contact_info,
        section_info=section_info,
        keyword_result=keyword_result,
        semantic_result=semantic_result,
        experience_result=experience_result,
        ats_issues=ats_issues,
        has_jd=False
    )

    assert res["score"] > 50
    assert res["categories"].structure > 0
    assert res["categories"].contact == 5.0
