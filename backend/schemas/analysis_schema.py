from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime

class AnalysisStartResponse(BaseModel):
    message: str
    analysis_job_id: UUID
    status: str

class AnalysisResultResponse(BaseModel):
    analysis_job_id: UUID
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    results: Dict[str, Any]
