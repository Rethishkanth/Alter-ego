from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID

class ChatRequest(BaseModel):
    question: str
    analysis_job_id: Optional[UUID] = None
    mode: str = "mirror" # 'mirror' or 'devil'

class ChatResponse(BaseModel):
    avatar_response: str
    audio_url: Optional[str] = None
    context_used: List[Dict[str, Any]] = []
    confidence: float = 1.0
    should_speak: bool = True
