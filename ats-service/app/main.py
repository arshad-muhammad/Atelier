"""Atelier Dedicated ATS Resume Analyzer Service."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .api.routes import router
from .services.embedding_service import EmbeddingService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ats.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: Pre-loads the BGE embedding model into memory once on startup."""
    logger.info("Initializing Atelier ATS Service...")
    logger.info(f"Target BGE model: {settings.MODEL_NAME} on device: {settings.DEVICE}")

    # Load BGE model singleton into RAM
    embedding_service = EmbeddingService.get_instance()
    success = embedding_service.load_model()
    if success:
        logger.info("BGE Embedding model pre-warmed and ready in RAM.")
    else:
        logger.warning("BGE Embedding model could not be pre-warmed. Will attempt lazy-load on first request.")

    yield

    logger.info("Shutting down Atelier ATS Service.")

app = FastAPI(
    title="Atelier Dedicated ATS Service",
    description="High-performance, privacy-focused ATS Resume Analyzer powered by local BGE embeddings.",
    version=settings.SERVICE_VERSION,
    lifespan=lifespan
)

# CORS middleware restricted to Atelier domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler without leaking stack traces or PII
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal processing error occurred while analyzing the document."}
    )

# Register API routes
app.include_router(router)

@app.get("/")
def root():
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )
