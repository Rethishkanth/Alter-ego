from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from config.database import get_db
from database import crud
from services.autopsy_service import generate_autopsy_report

router = APIRouter()

@router.get("/autopsy/latest", tags=["Autopsy"])
async def get_latest_autopsy_job(db: Session = Depends(get_db)):
    """
    Retrieves the ID of the latest analysis job.
    """
    job = crud.get_latest_analysis_job(db)
    if not job:
        raise HTTPException(status_code=404, detail="No analysis job found")
    return {"job_id": job.id}

from typing import Optional

@router.post("/autopsy/generate", tags=["Autopsy"])
async def trigger_autopsy(
    job_id: Optional[UUID] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Triggers the generation of the Autopsy Report (Psychological Profile).
    """
    # If no job_id provided, use latest
    if not job_id:
        latest_job = crud.get_latest_analysis_job(db)
        if not latest_job:
            raise HTTPException(status_code=404, detail="No analysis job found to analyze")
        job_id = latest_job.id
    
    # Verify job exists
    job = db.query(crud.models.AnalysisJob).filter(crud.models.AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        report = generate_autopsy_report(job_id, db)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/autopsy/{job_id}", tags=["Autopsy"])
async def get_autopsy_report(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Retrieves an existing Autopsy Report.
    """
    result = crud.get_analysis_result(db, job_id, "autopsy_report")
    if not result:
        raise HTTPException(status_code=404, detail="Autopsy report not found")
    
    return result.result_data
