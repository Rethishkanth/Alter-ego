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
    Generate speech audio from text using Local F5-TTS.
    """
    # Use Local F5-TTS
    from services.local_tts_service import generate_audio_local
    
    # We don't need to specify ref_audio here as local_tts_service handles defaults
    # unless we want to pass a specific one.
    return generate_audio_local(text)


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
