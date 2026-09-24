# Multi-stage production Dockerfile for Atelier ATS Service
FROM python:3.12-slim

# Set working directory and environment variables
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    ATS_MODEL_NAME=BAAI/bge-small-en-v1.5 \
    MODEL_CACHE_DIR=/models_cache \
    HF_HUB_DISABLE_SYMLINKS_WARNING=1 \
    TOKENIZERS_PARALLELISM=false

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create cache directory and pre-download BGE model directly into the image layer
RUN mkdir -p /models_cache && \
    python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en-v1.5', cache_folder='/models_cache')"

# Copy application source code
COPY . .

# Expose default port (documentary)
EXPOSE 8000

# Start FastAPI server dynamically binding to $PORT provided by Render/Railway/Fly.io
# Single worker ensures RAM consumption stays safely under 512MB on free tier
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]

