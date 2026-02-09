from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import tempfile
import os

from config.database import get_db
from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import process_chat_request
from services import voice_service
from database import crud

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
async def ask_avatar(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    if not request.analysis_job_id:
        # Try to find the latest job if not provided
        latest_job = crud.get_latest_analysis_job(db)
        if not latest_job:
            raise HTTPException(status_code=400, detail="No analysis found. Please upload data first.")
        job_id = latest_job.id
    else:
        job_id = request.analysis_job_id
        
    return process_chat_request(db, job_id, request.question)


@router.post("/voice")
def voice_interaction(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Handle voice-based chat:
    1. Receive audio file
    2. Transcribe with Whisper (local)
    3. Get LLM response
    4. Generate speech with F5-TTS (cloud)
    5. Return text + audio URL
    """
    temp_path = None
    try:
        # 1. Save uploaded audio to temp file
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = file.file.read()
            tmp.write(content)
            temp_path = tmp.name
        
        # 2. Transcribe audio to text
        user_text = voice_service.transcribe_audio(temp_path)
        if not user_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio. Please try again.")
        
        # 3. Get LLM response (reuse existing logic)
        latest_job = crud.get_latest_analysis_job(db)
        if not latest_job:
            raise HTTPException(status_code=400, detail="No analysis found. Please upload data first.")
        
        chat_response = process_chat_request(db, latest_job.id, user_text)
        avatar_response = chat_response.avatar_response
        
        # 4. Generate speech from response
        audio_url = voice_service.generate_speech(avatar_response)
        
        return JSONResponse(content={
            "user_text": user_text,
            "avatar_response": avatar_response,
            "audio_url": audio_url
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")
    finally:
        # 5. Cleanup temp file
        if temp_path:
            voice_service.cleanup_temp_file(temp_path)

