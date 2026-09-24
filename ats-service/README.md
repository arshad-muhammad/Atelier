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

---

## Deploying to Render (Free Tier)

Render requires binding to a dynamically assigned `$PORT` (typically `10000`) and detecting an open port within seconds of container start. The `Dockerfile` has been optimized specifically for Render.

### Step 1: Create a New Web Service on Render
1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Atelier`).
3. Configure the service settings:
   - **Name**: `atelier-ats-service`
   - **Region**: Choose closest to your users (e.g. Frankfurt, Oregon, Singapore).
   - **Language / Runtime**: **Docker**
   - **Root Directory**: `ats-service`
   - **Dockerfile Path**: `./Dockerfile` (relative to Root Directory)
   - **Instance Type**: **Free** (0.5 CPU, 512 MB RAM)

### Step 2: Environment Variables (Render Dashboard)
Add the following under **Environment Variables**:
| Key | Value | Notes |
|---|---|---|
| `PORT` | `10000` | (Render sets this automatically, but you can explicitly specify it) |
| `ATS_MODEL_NAME` | `BAAI/bge-small-en-v1.5` | Default lightweight 384-dim BGE model |
| `MODEL_CACHE_DIR` | `/models_cache` | Points to pre-baked model weights |
| `ATS_API_KEY` | *(Your secret key)* | Optional shared secret between Atelier Next.js and ATS service |

### Step 3: Connect with Atelier Next.js (Vercel)
Once Render deploys your ATS service, it will give you a public URL (e.g., `https://atelier-ats-service.onrender.com`).

Add this environment variable to your Next.js project on **Vercel** or local `.env.local`:
```env
ATS_SERVICE_URL=https://atelier-ats-service.onrender.com
ATS_API_KEY=your-secret-key-if-configured
```

### Why Render's Port Detection Works Smoothly Now
1. **Pre-baked Model**: BGE weights (`model.safetensors`) are downloaded during the Docker build stage and stored in `/models_cache`. Startup takes ~1-2 seconds with zero network latency.
2. **Instant Port Binding**: The ASGI lifespan handler initializes uvicorn's socket immediately so Render's port detection never times out.
3. **Single Worker**: Running `--workers 1` keeps memory consumption under 380MB, well below Render's 512MB free tier cap.

