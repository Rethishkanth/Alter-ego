from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import process_chat_request
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
