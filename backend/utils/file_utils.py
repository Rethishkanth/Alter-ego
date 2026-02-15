import os
import shutil
import zipfile
import json
import uuid
import tempfile
from typing import List, Dict, Any

def save_temp_file(file_obj, filename: str) -> str:
    """
    Save an uploaded file to a temporary directory.
    Returns the absolute path to the saved file.
    """
    temp_dir = os.path.join(tempfile.gettempdir(), "youtube_avatar_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(temp_dir, unique_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file_obj.file, buffer)
        
    return file_path

def extract_zip(zip_path: str) -> str:
    """
    Extract a zip file to a temporary directory.
    Returns the path to the extracted directory.
    """
    extract_path = os.path.join(os.path.dirname(zip_path), f"extracted_{uuid.uuid4().hex}")
    os.makedirs(extract_path, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
        
    return extract_path

def read_json_file(file_path: str) -> Dict[str, Any] | List[Any]:
    """Read and parse a JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def cleanup_temp_files(path: str):
    """
    Recursively invalidates and removes a file or directory.
    """
    try:
        if os.path.isfile(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)
    except Exception as e:
        print(f"Error cleaning up temp files at {path}: {e}")

def detect_file_type(extracted_path: str) -> str:
    """
    Detect the type of data based on directory structure.
    Currently supports: 'youtube'
    """
    # Simple heuristic: Look for 'YouTube' folder or specific JSON names
    for root, dirs, files in os.walk(extracted_path):
        if "YouTube" in dirs: # Takeout structure often has a top-level YouTube folder
             return "youtube"
        if "watch-history.json" in files:
            return "youtube"
            
    # Default to YouTube for this MVP if strictly ambiguous but has JSONs
    return "youtube"
