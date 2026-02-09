"""
Voice Service: Handles Speech-to-Text (Local Whisper) and Text-to-Speech (Cloud F5-TTS).
"""
import os
import tempfile
import glob

# Add FFmpeg to PATH (winget install requires shell restart, so we add it manually)
ffmpeg_paths = glob.glob(r"C:\Users\*\AppData\Local\Microsoft\WinGet\Packages\*ffmpeg*\*\bin")
for ffmpeg_path in ffmpeg_paths:
    if os.path.exists(ffmpeg_path):
        os.environ["PATH"] = ffmpeg_path + os.pathsep + os.environ.get("PATH", "")
        break

import whisper
import replicate
from pathlib import Path
from config.settings import settings
from middleware.logger import logger

# Load Whisper model once at startup (base model for speed/memory balance)
_whisper_model = None

def get_whisper_model():
    """Lazy load the Whisper model."""
    global _whisper_model
    if _whisper_model is None:
        logger.info("Loading Whisper 'base' model...")
        _whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully.")
    return _whisper_model


def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio file to text using local Whisper.
    
    Args:
        file_path: Path to the audio file (wav, webm, mp3, etc.)
    
    Returns:
        Transcribed text string.
    """
    try:
        model = get_whisper_model()
        result = model.transcribe(file_path)
        text = result.get("text", "").strip()
        logger.info(f"Transcription successful: '{text[:50]}...'")
        return text
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        raise RuntimeError(f"Failed to transcribe audio: {e}")


def generate_speech(text: str) -> str:
    """
    Generate speech audio from text using Cloud F5-TTS via Replicate.
    
    Args:
        text: The text to convert to speech.
    
    Returns:
        URL to the generated audio file.
    """
    if not settings.REPLICATE_API_TOKEN:
        logger.warning("REPLICATE_API_TOKEN not set. Using fallback (no audio).")
        return ""
    
    try:
        # Set the API token for the replicate client
        os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN
        
        output = replicate.run(
            "lucataco/f5-tts:4f73966f83a33356c33c5cbdf7449510895602e67e2bd40d86a73478238fd000",
            input={
                "gen_text": text,
                "ref_audio": "https://replicate.delivery/pbxt/M2AoJHPJNR5sKv7UMmkxCDfPJNE04Lk1LRQ39aDbEgxaZ7uL/basic_ref_en.wav",
                "ref_text": "Some call me nature, others call me mother nature."
            }
        )
        
        # Output is a URL to the generated audio
        audio_url = str(output) if output else ""
        logger.info(f"TTS generation successful: {audio_url[:80]}...")
        return audio_url
        
    except Exception as e:
        logger.error(f"F5-TTS generation error: {e}")
        return ""


def cleanup_temp_file(file_path: str) -> None:
    """
    Remove a temporary file after processing.
    """
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"Cleaned up temp file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup temp file {file_path}: {e}")
