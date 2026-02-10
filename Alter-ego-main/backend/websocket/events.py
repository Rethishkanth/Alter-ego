from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional

# Event Type Constants
UPLOAD_STARTED = "upload_started"
UPLOAD_PROGRESS = "upload_progress"
UPLOAD_COMPLETE = "upload_complete"
PARSING_PROGRESS = "parsing_progress"

ANALYSIS_STARTED = "analysis_started"
ANALYSIS_PROGRESS = "analysis_progress"
ANALYSIS_STEP_COMPLETE = "analysis_step_complete" # e.g. "sentiment_complete"
ANALYSIS_COMPLETE = "analysis_complete"

@dataclass
class WSMessage:
    type: str
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

    def to_json(self) -> Dict[str, Any]:
        return asdict(self)
