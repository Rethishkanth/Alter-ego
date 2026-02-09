from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from config.database import get_db
from database import crud
from schemas.analysis_schema import AnalysisStartResponse, AnalysisResultResponse
from services.analysis_service import run_analysis_pipeline

router = APIRouter()

@router.post("/analyze", response_model=AnalysisStartResponse)
async def start_analysis(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Check for existing in-progress job
    # For MVP, we might just allow one global job or per user session if we had auth
    # Let's just create a new one
    
    job = crud.create_analysis_job(db)
    
    # Run in background
    background_tasks.add_task(run_analysis_pipeline, job.id, db)
    
    return AnalysisStartResponse(
        message="Analysis started in background",
        analysis_job_id=job.id,
        status="pending"
    )

@router.get("/analyze/{job_id}", response_model=AnalysisResultResponse)
async def get_analysis_results(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    job = db.query(crud.models.AnalysisJob).filter(crud.models.AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    results = crud.get_analysis_results(db, job_id)
    results_dict = {r.analysis_type: r.result_data for r in results}
    
    return AnalysisResultResponse(
        analysis_job_id=job.id,
        status=job.status,
        created_at=job.created_at,
        completed_at=job.completed_at,
        results=results_dict
    )
