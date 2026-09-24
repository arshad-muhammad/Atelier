"""Configuration module for Atelier ATS Service."""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Service Info
    SERVICE_NAME: str = "Atelier ATS Service"
    SERVICE_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Security & Auth
    # Shared secret key between Next.js server and ATS service
    ATS_API_KEY: str = os.getenv("ATS_API_KEY", "")

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://atelier.spherehive.com",
        "https://spherehive.com",
    ]

    # Model Configuration
    # Easily swappable to BAAI/bge-base-en-v1.5 or BAAI/bge-m3 without code changes
    MODEL_NAME: str = os.getenv("ATS_MODEL_NAME", "BAAI/bge-small-en-v1.5")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", os.path.join(os.path.dirname(__file__), "..", "models_cache"))
    DEVICE: str = os.getenv("ATS_DEVICE", "cpu")  # cpu or cuda

    # File Parsing Limits
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/octet-stream",
    ]
    PARSE_TIMEOUT_SECONDS: int = 30

    # Configurable Scoring Weights (Must sum to 100)
    WEIGHT_KEYWORD_MATCH: float = 35.0
    WEIGHT_SEMANTIC_RELEVANCE: float = 25.0
    WEIGHT_REQUIRED_SKILLS: float = 20.0
    WEIGHT_STRUCTURE: float = 10.0
    WEIGHT_FORMATTING: float = 5.0
    WEIGHT_CONTACT: float = 5.0

    # Scoring Weights for Resume-Only (when no Job Description is provided)
    RESUME_ONLY_WEIGHT_SKILLS: float = 30.0
    RESUME_ONLY_WEIGHT_STRUCTURE: float = 25.0
    RESUME_ONLY_WEIGHT_FORMATTING: float = 20.0
    RESUME_ONLY_WEIGHT_CONTACT: float = 15.0
    RESUME_ONLY_WEIGHT_EXPERIENCE: float = 10.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
