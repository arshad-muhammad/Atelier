"""API Router for Atelier ATS Service."""
import logging
import os
import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header, Depends, status

from ..config import settings
from ..models.schemas import HealthResponse, AnalysisResponse, CandidatePreview, ContactInfo
from ..parsers.pdf_parser import PDFParser
from ..parsers.docx_parser import DOCXParser
from ..analysis.sections import SectionAnalyzer
from ..analysis.formatting import FormattingAnalyzer
from ..analysis.contact import ContactAnalyzer
from ..analysis.skills import SkillExtractor
from ..analysis.keywords import KeywordMatcher
from ..analysis.experience import ExperienceAnalyzer
from ..analysis.semantic import SemanticMatcher
from ..analysis.scoring import ScoringEngine
from ..services.embedding_service import EmbeddingService

logger = logging.getLogger("ats.api")
router = APIRouter(prefix="/api/v1", tags=["ATS Resume Analyzer"])

# Observability Metrics in Memory
metrics_store = {
    "analysis_count": 0,
    "total_analysis_time_ms": 0.0,
    "parsing_failures": 0,
    "error_count": 0,
    "model_inference_time_ms": 0.0,
}

def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """Validates optional shared secret API key between Atelier server and ATS service."""
    if settings.ATS_API_KEY:
        if not x_api_key or x_api_key != settings.ATS_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid ATS API Key."
            )
    return True

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns service and BGE embedding model status."""
    service = EmbeddingService.get_instance()
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
        model=settings.MODEL_NAME,
        model_loaded=service.is_loaded,
        device=settings.DEVICE,
        version=settings.SERVICE_VERSION
    )

@router.get("/metrics")
async def get_metrics(authenticated: bool = Depends(verify_api_key)):
    """Exposes privacy-safe aggregate service metrics without PII."""
    count = metrics_store["analysis_count"]
    avg_time = (metrics_store["total_analysis_time_ms"] / count) if count > 0 else 0.0
    return {
        "analysis_count": count,
        "average_analysis_time_ms": round(avg_time, 2),
        "parsing_failures": metrics_store["parsing_failures"],
        "error_count": metrics_store["error_count"],
        "model_inference_time_ms": round(metrics_store["model_inference_time_ms"], 2),
    }

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    authenticated: bool = Depends(verify_api_key)
):
    """Production endpoint to analyze an uploaded resume against ATS criteria and optional job description."""
    start_time = time.time()

    # 1. Validate File Size & Extension
    filename = (resume.filename or "").lower()
    file_ext = os.path.splitext(filename)[1]

    if file_ext not in settings.ALLOWED_EXTENSIONS:
        metrics_store["error_count"] += 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats are PDF and DOCX."
        )

    # 2. Read bytes securely with memory guard
    try:
        file_bytes = await resume.read()
    except Exception as e:
        metrics_store["error_count"] += 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file."
        )

    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        metrics_store["error_count"] += 1
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    if len(file_bytes) < 100:
        metrics_store["error_count"] += 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty or corrupted."
        )

    # 3. Parse Document (PDF or DOCX)
    try:
        if file_ext == ".pdf":
            parsed_doc = PDFParser.parse(file_bytes)
        elif file_ext == ".docx":
            parsed_doc = DOCXParser.parse(file_bytes)
        else:
            raise ValueError(f"Unsupported extension {file_ext}")
    except Exception as e:
        metrics_store["parsing_failures"] += 1
        metrics_store["error_count"] += 1
        logger.error(f"Document parsing error for {file_ext} file: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse document: {str(e)}"
        )

    full_text = parsed_doc.get("full_text", "")
    links = parsed_doc.get("links", [])

    # 4. Extract Contact Information
    contact_dict = ContactAnalyzer.analyze(full_text, links)

    # 5. Segment Sections
    section_info = SectionAnalyzer.segment_resume(full_text)

    # 6. Extract Skills from Resume
    skill_extractor = SkillExtractor()
    resume_skills = skill_extractor.extract_skills_from_text(full_text)

    # 7. Parse Job Description if provided
    has_jd = bool(job_description and job_description.strip())
    jd_analysis = skill_extractor.parse_job_description(job_description or "")
    if has_jd:
        jd_analysis["raw_text"] = job_description

    # 8. Multi-tier Keyword Matching
    keyword_matcher = KeywordMatcher()
    keyword_result = keyword_matcher.match(resume_skills, jd_analysis)

    # 9. Experience & Bullet Point Impact Analysis
    exp_text = section_info["sections"].get("experience", "")
    experience_result = ExperienceAnalyzer.analyze(exp_text)
    bullets = ExperienceAnalyzer.extract_bullets(exp_text)

    # 10. Semantic Matching with BGE Embeddings
    inference_start = time.time()
    semantic_matcher = SemanticMatcher()
    semantic_result = semantic_matcher.match(
        resume_sections=section_info["sections"],
        experience_bullets=bullets,
        jd_analysis=jd_analysis
    )
    inference_duration = (time.time() - inference_start) * 1000.0
    metrics_store["model_inference_time_ms"] += inference_duration

    # 11. ATS Layout & Formatting Rules Inspection
    ats_issues = FormattingAnalyzer.analyze(
        parsed_doc=parsed_doc,
        contact_info=contact_dict,
        section_info=section_info
    )

    # 12. Scoring Engine
    scoring_result = ScoringEngine.calculate(
        parsed_doc=parsed_doc,
        contact_info=contact_dict,
        section_info=section_info,
        keyword_result=keyword_result,
        semantic_result=semantic_result,
        experience_result=experience_result,
        ats_issues=ats_issues,
        has_jd=has_jd
    )

    elapsed_ms = (time.time() - start_time) * 1000.0

    # Record metrics
    metrics_store["analysis_count"] += 1
    metrics_store["total_analysis_time_ms"] += elapsed_ms

    # Build Candidate Preview
    preview_name = contact_dict.get("candidate_name") or "Candidate"
    
    # Detect title if available in top lines
    detected_title = "Software Engineer"
    lines = [l.strip() for l in full_text.splitlines() if l.strip()]
    for l in lines[1:6]:
        if any(term in l.lower() for term in ["engineer", "developer", "architect", "designer", "scientist", "analyst"]):
            detected_title = l
            break

    candidate_preview = CandidatePreview(
        name=preview_name,
        detected_title=detected_title,
        contact=ContactInfo(**contact_dict),
        total_pages=parsed_doc.get("page_count", 1),
        total_words=parsed_doc.get("total_words", 0),
        extracted_snippet=full_text[:400]
    )

    return AnalysisResponse(
        score=scoring_result["score"],
        score_grade=scoring_result["score_grade"],
        has_job_description=has_jd,
        categories=scoring_result["categories"],
        metrics=scoring_result["metrics"],
        matched_skills=keyword_result["matched_skills"],
        missing_skills=keyword_result["missing_skills"],
        related_skills=keyword_result["related_skills"],
        detected_sections=section_info["present_sections"],
        missing_sections=section_info["missing_sections"],
        section_order_status="Good Section Order" if section_info["is_order_good"] else "Section Order Warning",
        ats_issues=ats_issues,
        recommendations=scoring_result["recommendations"],
        experience_highlights=experience_result.get("improvement_highlights", []),
        candidate_preview=candidate_preview,
        processing_time_ms=round(elapsed_ms, 2)
    )
