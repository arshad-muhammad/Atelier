"""Integration tests for FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "BAAI/bge-small-en-v1.5" in data["model"]

def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "analysis_count" in data
    assert "average_analysis_time_ms" in data

def test_analyze_pdf_endpoint(sample_pdf_bytes, sample_job_description):
    files = {"resume": ("resume.pdf", sample_pdf_bytes, "application/pdf")}
    data = {"job_description": sample_job_description}
    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["score"] > 50
    assert res["score_title"] == "Atelier Resume Compatibility Score"
    assert res["has_job_description"] is True
    assert "keyword_match" in res["categories"]
    assert len(res["matched_skills"]) > 0

def test_analyze_docx_endpoint(sample_docx_bytes):
    files = {"resume": ("resume.docx", sample_docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["score"] > 50
    assert res["has_job_description"] is False

def test_invalid_extension():
    files = {"resume": ("malicious.exe", b"binary content", "application/octet-stream")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_empty_file():
    files = {"resume": ("empty.pdf", b"", "application/pdf")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
