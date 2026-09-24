"""Pydantic schemas for Atelier ATS Service."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "Atelier ATS Service"
    model: str = "BAAI/bge-small-en-v1.5"
    model_loaded: bool = False
    device: str = "cpu"
    version: str = "1.0.0"

class ATSIssue(BaseModel):
    issue: str
    severity: str = Field(..., description="LOW, MEDIUM, or HIGH")
    explanation: str

class ContactInfo(BaseModel):
    name_detected: bool = False
    email_detected: bool = False
    phone_detected: bool = False
    linkedin_detected: bool = False
    github_detected: bool = False
    portfolio_detected: bool = False
    candidate_name: Optional[str] = None
    masked_email: Optional[str] = None
    masked_phone: Optional[str] = None
    links: List[str] = []

class MatchedSkill(BaseModel):
    skill: str
    match_type: str = Field("exact", description="exact, normalized, synonym, or category")
    canonical_name: str
    category: str = "general"

class MissingSkill(BaseModel):
    skill: str
    importance: str = "required"
    category: str = "general"

class Recommendation(BaseModel):
    id: str
    category: str
    title: str
    guidance: str
    example: Optional[str] = None
    severity: str = "info"

class CategoryScores(BaseModel):
    keyword_match: float
    semantic_relevance: float
    required_skills: float
    structure: float
    formatting: float
    contact: float

class LiveMetrics(BaseModel):
    parse_rate: int = 98
    keyword_match: int = 85
    content_quality: int = 94
    impact_score: int = 88
    ats_compatibility: int = 92

class CandidatePreview(BaseModel):
    name: Optional[str] = None
    detected_title: Optional[str] = None
    contact: ContactInfo
    total_pages: int = 1
    total_words: int = 0
    extracted_snippet: str = ""

class AnalysisResponse(BaseModel):
    score: int
    score_grade: str
    score_title: str = "Atelier Resume Compatibility Score"
    disclaimer: str = "Estimated compatibility based on resume structure, job requirements, keyword coverage and semantic relevance."
    has_job_description: bool = False
    categories: CategoryScores
    metrics: LiveMetrics
    matched_skills: List[MatchedSkill] = []
    missing_skills: List[MissingSkill] = []
    related_skills: List[str] = []
    detected_sections: List[str] = []
    missing_sections: List[str] = []
    section_order_status: str = "Good Section Order"
    ats_issues: List[ATSIssue] = []
    recommendations: List[Recommendation] = []
    experience_highlights: List[Dict[str, Any]] = []
    candidate_preview: CandidatePreview
    processing_time_ms: float
