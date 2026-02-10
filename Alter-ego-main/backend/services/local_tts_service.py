import os
import soundfile as sf
import torch
import uuid
from pathlib import Path
from config.settings import settings
from middleware.logger import logger

# Global instance
_f5_model = None

def get_f5_model():
    global _f5_model
    if _f5_model:
        return _f5_model
        
    try:
        from f5_tts.api import F5TTS
        logger.info("Loading Local F5-TTS Model (this may take time)...")
        # Initialize F5TTS. It might download weights to HF_HOME automatically.
        # We assume the user has set HF_HOME via instructions if they want it on E:
        _f5_model = F5TTS() 
        logger.info("Local F5-TTS Model Loaded successfully.")
    except ImportError:
        logger.error("F5-TTS package not found. Please install it manually.")
        return None
    except Exception as e:
        logger.error(f"Failed to load F5-TTS: {e}")
        return None
    return _f5_model

def generate_audio_local(text: str, ref_audio_path: str = None, ref_text: str = "") -> str:
    """
    Generate audio using local F5-TTS.
    """
    model = get_f5_model()
    if not model:
        logger.warning("F5-TTS model not available. Skipping generation.")
        return ""
        
    try:
        # Default reference if not provided
        if not ref_audio_path:
            # Look for a default in mock_data or uploads
            default_ref = os.path.join(os.getcwd(), "mock_data", "ref_audio.wav")
            if os.path.exists(default_ref):
                ref_audio_path = default_ref
                # If no ref text, use a generic one or filename
                if not ref_text:
                    ref_text = "The quick brown fox jumps over the lazy dog." 
            else:
                logger.error("No reference audio provided and no default found at mock_data/ref_audio.wav")
                return ""

        output_filename = f"out_{uuid.uuid4().hex}.wav"
        output_dir = os.path.join(os.getcwd(), "static", "audio") # Ensure this exists
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)
        
        # Inference
        # Note: API signature might vary. Adjusting based on common F5 usage.
        # Ensure text is not empty
        if not text.strip():
            return ""
            
        wav, sr, _ = model.infer(
            ref_file=ref_audio_path,
            ref_text=ref_text,
            gen_text=text
        )
        
        # Save to file
        sf.write(output_path, wav, sr)
        logger.info(f"Generated audio saved to {output_path}")
        
        # Return URL relative to static
        # Assuming backend serves /static
        return f"{settings.BACKEND_URL}/static/audio/{output_filename}"
        
    except Exception as e:
        logger.error(f"Local F5-TTS Generation Error: {e}")
        return ""
