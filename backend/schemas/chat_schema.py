from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID

class ChatRequest(BaseModel):
    question: str
    analysis_job_id: Optional[UUID] = None

class ChatResponse(BaseModel):
    avatar_response: str
    context_used: List[Dict[str, Any]]
    confidence: float
    should_speak: bool = True
