import hashlib
from typing import Optional

def generate_content_hash(title: str, channel: Optional[str], date_str: Optional[str]) -> str:
    """
    Generate a SHA-256 hash for a content item to ensure deduplication.
    The hash is based on: title + channel + date
    """
    # Normalize inputs
    title_norm = title.strip().lower() if title else ""
    channel_norm = channel.strip().lower() if channel else ""
    date_norm = str(date_str).strip() if date_str else ""
    
    # Create valid composite string
    unique_string = f"{title_norm}_{channel_norm}_{date_norm}"
    
    return hashlib.sha256(unique_string.encode('utf-8')).hexdigest()
