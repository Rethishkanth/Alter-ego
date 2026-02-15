from transformers import pipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info("Content: Loading sentiment analysis model...")
    _sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    logger.info("Content: Model loaded successfully.")
    print("Success")
except Exception as e:
    logger.error(f"Failed to load sentiment model: {e}")
    print(f"Error: {e}")
