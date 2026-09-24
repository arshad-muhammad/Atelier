"""Unit tests for ATS analysis modules."""
import pytest
from app.analysis.sections import SectionAnalyzer
from app.analysis.contact import ContactAnalyzer
from app.analysis.skills import SkillExtractor, SkillTaxonomy
from app.analysis.keywords import KeywordMatcher
from app.analysis.experience import ExperienceAnalyzer
from app.analysis.formatting import FormattingAnalyzer

def test_section_segmentation(sample_resume_text):
    info = SectionAnalyzer.segment_resume(sample_resume_text)
    assert "skills" in info["present_sections"]
    assert "experience" in info["present_sections"]
    assert "education" in info["present_sections"]
    assert "projects" in info["present_sections"]
    assert info["is_order_good"] is True

def test_contact_analyzer(sample_resume_text):
    contact = ContactAnalyzer.analyze(sample_resume_text, ["https://github.com/johndoe"])
    assert contact["email_detected"] is True
    assert contact["phone_detected"] is True
    assert contact["github_detected"] is True
    assert contact["linkedin_detected"] is True
    assert "@" in contact["masked_email"]
    assert "*" in contact["masked_email"]  # Assert PII masking
    assert contact["candidate_name"] == "John Doe"

def test_skill_synonym_normalization():
    extractor = SkillExtractor()
    text = "We use ReactJS, Postgres, Node, and Golang alongside RESTful APIs."
    skills = extractor.extract_skills_from_text(text)
    
    assert "react" in skills
    assert "postgresql" in skills
    assert "node.js" in skills
    assert "rest api" in skills

def test_keyword_matching(sample_resume_text, sample_job_description):
    extractor = SkillExtractor()
    resume_skills = extractor.extract_skills_from_text(sample_resume_text)
    jd_analysis = extractor.parse_job_description(sample_job_description)
    
    matcher = KeywordMatcher()
    result = matcher.match(resume_skills, jd_analysis)
    
    matched_names = [m.canonical_name for m in result["matched_skills"]]
    assert "react" in matched_names
    assert "typescript" in matched_names
    assert "docker" in matched_names
    assert result["coverage_ratio"] > 0.60

def test_experience_bullet_analysis():
    bullets = [
        "Architected RESTful microservices using Node.js, improving API response time by 40%.",
        "Worked on a React application."
    ]
    eval_1 = ExperienceAnalyzer.evaluate_bullet(bullets[0])
    assert eval_1["has_action_verb"] is True
    assert eval_1["has_metric"] is True
    assert eval_1["guidance"] is None

    eval_2 = ExperienceAnalyzer.evaluate_bullet(bullets[1])
    assert eval_2["has_weak_starter"] is True
    assert eval_2["guidance"] is not None

def test_formatting_analyzer(sample_resume_text):
    parsed_doc = {
        "full_text": sample_resume_text,
        "page_count": 1,
        "total_words": len(sample_resume_text.split()),
        "has_two_columns": False,
        "table_count": 0,
        "has_very_small_font": False,
        "scanned_image_suspected": False,
    }
    contact = ContactAnalyzer.analyze(sample_resume_text, [])
    sections = SectionAnalyzer.segment_resume(sample_resume_text)
    
    issues = FormattingAnalyzer.analyze(parsed_doc, contact, sections)
    # A clean single-column resume should have no HIGH severity issues
    high_issues = [i for i in issues if i.severity == "HIGH"]
    assert len(high_issues) == 0
