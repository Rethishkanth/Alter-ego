from transformers import pipeline
from typing import List, Dict, Any
from middleware.logger import logger
import datetime

# Singleton to avoid reloading model
_sentiment_analyzer = None

def get_analyzer():
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        try:
            logger.info("Loading sentiment analysis model...")
            # using a smaller, faster model for MVP
            _sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            raise e
    return _sentiment_analyzer

def analyze_sentiment(texts: List[str]) -> List[Dict[str, Any]]:
    """
    Analyze sentiment for a batch of texts.
    Returns: [{'label': 'POSITIVE', 'score': 0.99}, ...]
    """
    analyzer = get_analyzer()
    # Truncate texts to 512 tokens (simple char limit for now) to avoid errors
    truncated_texts = [t[:512] for t in texts]
    try:
        results = analyzer(truncated_texts)
        return results
    except Exception as e:
        logger.error(f"Error during sentiment analysis: {e}")
        # Return neutral fallback
        return [{"label": "NEUTRAL", "score": 0.5} for _ in texts]
