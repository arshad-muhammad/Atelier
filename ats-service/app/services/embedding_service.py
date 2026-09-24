"""BGE Embedding Service (BAAI/bge-small-en-v1.5) with Singleton Model Manager."""
import hashlib
import logging
import threading
from typing import List, Union, Dict, Optional
import numpy as np

from ..config import settings

logger = logging.getLogger("ats.embedding")

class EmbeddingService:
    """Thread-safe Singleton Model Manager for self-hosted local embeddings."""

    _instance: Optional["EmbeddingService"] = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self):
        self.model = None
        self.model_name = settings.MODEL_NAME
        self.cache_dir = settings.MODEL_CACHE_DIR
        self.device = settings.DEVICE
        self._is_loaded = False
        # Memory embedding cache keyed by SHA256(text)
        self._cache: Dict[str, np.ndarray] = {}
        self._cache_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def load_model(self) -> bool:
        """Loads the sentence transformer model into memory once."""
        if self._is_loaded and self.model is not None:
            return True

        with self._lock:
            if self._is_loaded and self.model is not None:
                return True

            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading local BGE embedding model: {self.model_name} on {self.device}")
                self.model = SentenceTransformer(
                    self.model_name,
                    cache_folder=self.cache_dir,
                    device=self.device
                )
                self._is_loaded = True
                logger.info("BGE model successfully loaded into memory.")
                return True
            except Exception as e:
                logger.error(f"Failed to load BGE model {self.model_name}: {e}")
                self._is_loaded = False
                return False

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded and self.model is not None

    def _hash_text(self, text: str) -> str:
        return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()

    def get_embedding(self, text: str) -> np.ndarray:
        """Computes or retrieves cached normalized embedding for a single text chunk."""
        if not text or not text.strip():
            # Zero vector fallback (bge-small dimension is 384)
            return np.zeros(384, dtype=np.float32)

        clean_text = text.strip()
        h = self._hash_text(clean_text)

        with self._cache_lock:
            if h in self._cache:
                return self._cache[h]

        if not self.is_loaded:
            self.load_model()

        if self.model is None:
            raise RuntimeError("BGE model is not available.")

        # Compute normalized embedding
        vector = self.model.encode(
            clean_text,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        with self._cache_lock:
            # Simple eviction guard
            if len(self._cache) > 5000:
                self._cache.clear()
            self._cache[h] = vector

        return vector

    def get_batch_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """Computes embeddings for a batch of texts, leveraging cache for seen items."""
        if not texts:
            return []

        results: List[Optional[np.ndarray]] = [None] * len(texts)
        missing_indices: List[int] = []
        missing_texts: List[str] = []

        with self._cache_lock:
            for idx, text in enumerate(texts):
                clean_text = text.strip() if text else ""
                if not clean_text:
                    results[idx] = np.zeros(384, dtype=np.float32)
                    continue
                h = self._hash_text(clean_text)
                if h in self._cache:
                    results[idx] = self._cache[h]
                else:
                    missing_indices.append(idx)
                    missing_texts.append(clean_text)

        if missing_texts:
            if not self.is_loaded:
                self.load_model()
            if self.model is None:
                raise RuntimeError("BGE model is not available.")

            encoded_vectors = self.model.encode(
                missing_texts,
                normalize_embeddings=True,
                show_progress_bar=False,
                batch_size=32
            )

            with self._cache_lock:
                for idx, clean_text, vec in zip(missing_indices, missing_texts, encoded_vectors):
                    h = self._hash_text(clean_text)
                    self._cache[h] = vec
                    results[idx] = vec

        return [r if r is not None else np.zeros(384, dtype=np.float32) for r in results]

    @staticmethod
    def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Computes cosine similarity between two 1D vectors."""
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
