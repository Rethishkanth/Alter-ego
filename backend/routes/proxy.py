from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import requests
from middleware.logger import logger

router = APIRouter()

@router.get("/proxy_audio")
async def proxy_audio(url: str):
    """
    Proxies audio file from a URL to bypass CORS and ensure playability.
    """
    try:
        if not url.startswith("http"):
            raise HTTPException(status_code=400, detail="Invalid URL")
            
        logger.info(f"Proxying audio from: {url}")
        
        # Stream the response
        def iterfile():
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                for chunk in r.iter_content(chunk_size=8192):
                    yield chunk
                    
        # Determine content type if possible, default to wav
        return StreamingResponse(iterfile(), media_type="audio/wav")
        
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
