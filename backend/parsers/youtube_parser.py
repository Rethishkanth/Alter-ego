import os
import datetime
from typing import List, Dict, Any
from .base_parser import BaseParser
from utils.file_utils import read_json_file, cleanup_temp_files
from utils.hash_utils import generate_content_hash
from middleware.logger import logger

class YouTubeParser(BaseParser):
    def parse(self, temp_path: str) -> List[Dict[str, Any]]:
        posts = []
        try:
            # Locate watch-history.json
            watch_history_path = None
            for root, dirs, files in os.walk(temp_path):
                for file in files:
                    if file == "watch-history.json":
                        watch_history_path = os.path.join(root, file)
                        break
                if watch_history_path:
                    break
            
            if not watch_history_path:
                logger.warning("No watch-history.json found in upload")
                return []

            raw_data = read_json_file(watch_history_path)
            
            # Allow for both list (standard) and potentially other formats if API changes
            if not isinstance(raw_data, list):
                logger.warning(f"Unexpected JSON format for watch-history: {type(raw_data)}")
                return []

            logger.info(f"Found {len(raw_data)} entries in watch-history.json")

            for entry in raw_data:
                # Basic validation: needs title and time
                if "title" not in entry or "time" not in entry:
                    continue
                
                # Extract relevant fields
                title = entry.get("title", "").replace("Watched ", "", 1) # "Watched Title" -> "Title"
                title_url = entry.get("titleUrl", "")
                
                # Platform ID extraction (simple method)
                # https://www.youtube.com/watch?v=VIDEO_ID
                video_id = None
                if "v=" in title_url:
                    video_id = title_url.split("v=")[1]

                # Subtitles/Channel Name
                channel_name = "Unknown"
                if "subtitles" in entry and isinstance(entry["subtitles"], list) and len(entry["subtitles"]) > 0:
                    channel_name = entry["subtitles"][0].get("name", "Unknown")

                watch_time_str = entry.get("time")
                watch_date = None
                try:
                    # ISO format: 2023-10-27T14:30:00.000Z
                    # Python's fromisoformat doesn't always handle 'Z' well in older versions, but let's try
                    watch_date = datetime.datetime.fromisoformat(watch_time_str.replace("Z", "+00:00"))
                except Exception:
                     # Fallback or skip
                     pass

                # specific skip: "Visited YouTube Music" or ads often lack useful info
                if "Visited YouTube Music" in title:
                    continue

                content_hash = generate_content_hash(title, channel_name, str(watch_date))

                post = {
                    "platform": "youtube",
                    "platform_post_id": video_id,
                    "content_type": "video",
                    "title": title,
                    "channel_name": channel_name,
                    "watch_date": watch_date,
                    "content_hash": content_hash,
                    "video_metadata": {
                        "original_url": title_url,
                        "products": entry.get("products", []) # Sometimes contains device info
                    }
                }
                posts.append(post)

            logger.info(f"Successfully parsed {len(posts)} YouTube videos")
            return posts

        except Exception as e:
            logger.error(f"Error parsing YouTube data: {e}", exc_info=True)
            raise e

    def cleanup(self, temp_path: str):
        cleanup_temp_files(temp_path)
