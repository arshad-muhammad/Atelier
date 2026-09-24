# Atelier Dedicated ATS Resume Analyzer Service

Independent, high-performance ATS Resume Analysis microservice powered by **FastAPI** and self-hosted open-source **BAAI/bge-small-en-v1.5** embeddings.

---

## Key Features

- **100% Local & Privacy Preserving**: Zero external paid APIs (no OpenAI, no Gemini, no Claude, no Groq). No sensitive resume text or PII leaves the server.
- **Self-Hosted BGE Embeddings**: Uses `BAAI/bge-small-en-v1.5` loaded once as a singleton in memory. Easily replaceable with `BAAI/bge-base-en-v1.5` or `BAAI/bge-m3`.
- **Multi-Format Parsing**:
  - PDF: High-speed layout and text parsing via **PyMuPDF (`fitz`)**, with detection of multi-column layouts, tables, and tiny fonts.
  - DOCX: Native parsing via **python-docx**, detecting tables and headers/footers.
- **Explainable Scoring Engine**: Computes the *Atelier Resume Compatibility Score* with transparent breakdown across:
  - Keyword Match (35 pts)
  - Semantic Relevance (25 pts)
  - Required Skills (20 pts)
  - Resume Structure (10 pts)
  - Formatting & Layout (5 pts)
  - Contact Information (5 pts)
- **Deterministic Actionable Guidance**: No AI hallucinated rewrites; gives clear, structured advice on bullet metrics, layout changes, and missing skills.
- **Docker Ready**: Independent container deployment with persistent model volume cache.

---

## Local Setup & Development

### 1. Create Virtual Environment
```bash
cd ats-service
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Service
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at:
`http://localhost:8000/docs`

---

## API Reference

### `GET /api/v1/health`
Returns service and embedding model status.
```json
{
  "status": "ok",
  "service": "Atelier ATS Service",
  "model": "BAAI/bge-small-en-v1.5",
  "model_loaded": true,
  "device": "cpu",
  "version": "1.0.0"
}
```

### `POST /api/v1/analyze`
Accepts `multipart/form-data`:
- `resume`: PDF or DOCX file (up to 10MB)
- `job_description`: (Optional) Target job description text

Returns full structured analysis JSON with compatibility score, category breakdown, matched/missing skills, ATS issues, and deterministic recommendations.

### `GET /api/v1/metrics`
Exposes aggregate observability statistics (count, average latency, errors) without logging any PII.

---

## Docker Deployment

Run with Docker Compose:
```bash
docker-compose up -d --build
```
The model weights are cached in the persistent Docker volume `ats_model_cache` so they are never downloaded on container restarts.
