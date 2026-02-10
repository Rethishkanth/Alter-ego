from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
from middleware.logger import logger

_embedding_model = None

def get_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            logger.info("Loading embedding model...")
            # MiniLM is fast and good enough for semantic search
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise e
    return _embedding_model

def generate_embeddings(texts: List[str]) -> np.ndarray:
    """
    Generate embeddings for a list of texts.
    Returns a numpy array of shape (n_texts, 384)
    """
    model = get_model()
    try:
        embeddings = model.encode(texts)
        return embeddings
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return np.array([])

def encode_text(text: str) -> List[float]:
    """Encode a single text string."""
    model = get_model()
    return model.encode(text).tolist()
