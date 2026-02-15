from pydantic import BaseModel
from typing import Dict, Any

class UploadResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
