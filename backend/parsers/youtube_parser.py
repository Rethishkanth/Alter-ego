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
            # Locate watch-history.json or fallback to any JSON
            watch_history_path = None
            json_files = []
            
            for root, dirs, files in os.walk(temp_path):
                for file in files:
                    if file == "watch-history.json":
                        watch_history_path = os.path.join(root, file)
                        break
                    if file.endswith(".json"):
                        json_files.append(os.path.join(root, file))
                if watch_history_path:
                    break
            
            if not watch_history_path:
                if json_files:
                    watch_history_path = json_files[0]
                    logger.info(f"watch-history.json not found, falling back to: {watch_history_path}")
                else:
                    logger.warning("No JSON file found in upload")
                    return []

            raw_data = read_json_file(watch_history_path)
            
            # Case 1: Standard Google Takeout (List)
            if isinstance(raw_data, list):
                logger.info(f"Detected Google Takeout format. Found {len(raw_data)} entries.")
                return self._parse_takeout_format(raw_data)
            
            # Case 2: Custom/Scraped Format (Dict with 'captions', 'tweets')
            elif isinstance(raw_data, dict):
                logger.info("Detected Custom/Scraped format.")
                all_posts = []
                
                # Parse YouTube (under 'captions')
                if "captions" in raw_data and isinstance(raw_data["captions"], list):
                    logger.info(f"Found {len(raw_data['captions'])} YouTube entries.")
                    all_posts.extend(self._parse_custom_youtube(raw_data["captions"]))
                    
                # Parse Twitter (under 'tweets')
                if "tweets" in raw_data and isinstance(raw_data["tweets"], list):
                     logger.info(f"Found {len(raw_data['tweets'])} Twitter entries.")
                     all_posts.extend(self._parse_custom_twitter(raw_data["tweets"]))
                     
                return all_posts
            
            else:
                logger.warning(f"Unknown JSON format: {type(raw_data)}")
                return []

        except Exception as e:
            logger.error(f"Error parsing YouTube data: {e}", exc_info=True)
            raise e

    def _parse_takeout_format(self, raw_data: List[Dict]) -> List[Dict]:
        posts = []
        for entry in raw_data:
            if "title" not in entry or "time" not in entry:
                continue
            
            title = entry.get("title", "").replace("Watched ", "", 1)
            title_url = entry.get("titleUrl", "")
            video_id = None
            if "v=" in title_url:
                video_id = title_url.split("v=")[1]

            channel_name = "Unknown"
            if "subtitles" in entry and isinstance(entry["subtitles"], list) and len(entry["subtitles"]) > 0:
                channel_name = entry["subtitles"][0].get("name", "Unknown")

            watch_date = self._parse_iso_date(entry.get("time"))
            if "Visited YouTube Music" in title:
                continue

            content_hash = generate_content_hash(title, channel_name, str(watch_date))

            posts.append({
                "platform": "youtube",
                "platform_post_id": video_id,
                "content_type": "video",
                "title": title,
                "channel_name": channel_name,
                "watch_date": watch_date,
                "content_hash": content_hash,
                "video_metadata": {"original_url": title_url}
            })
        return posts

    def _parse_custom_youtube(self, data: List[Dict]) -> List[Dict]:
        posts = []
        for entry in data:
            title = entry.get("title", "")
            if not title: continue
            
            url = entry.get("url", "")
            video_id = entry.get("videoId")
            channel_name = entry.get("author", "Unknown")
            timestamp_str = entry.get("timestamp") # "09/02/2026, 16:23:49"
            
            watch_date = self._parse_custom_date(timestamp_str)
            content_hash = generate_content_hash(title, channel_name, str(watch_date))
            
            posts.append({
                "platform": "youtube",
                "platform_post_id": video_id,
                "content_type": "video",
                "title": title,
                "channel_name": channel_name,
                "watch_date": watch_date,
                "content_hash": content_hash,
                "video_metadata": {"original_url": url}
            })
        return posts

    def _parse_custom_twitter(self, data: List[Dict]) -> List[Dict]:
        posts = []
        for entry in data:
            text = entry.get("text", "")
            if not text: continue
            
            action = entry.get("action", "Tweeted") # Liked, Tweeted
            url = entry.get("url", "")
            timestamp_str = entry.get("timestamp")
            
            watch_date = self._parse_custom_date(timestamp_str)
            
            # For tweets, title is the text (truncated if needed)
            title = f"{action}: {text[:50]}..." 
            content_hash = generate_content_hash(text, action, str(watch_date))
            
            posts.append({
                "platform": "twitter",
                "platform_post_id": None,
                "content_type": "tweet",
                "title": title, # Store full text in metadata or description if model allows, for now title is OK
                "channel_name": action, # e.g. "Liked"
                "watch_date": watch_date,
                "content_hash": content_hash,
                "video_metadata": {"full_text": text, "url": url}
            })
        return posts

    def _parse_iso_date(self, date_str: str):
        try:
            return datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            return None

    def _parse_custom_date(self, date_str: str):
        # Format: "09/02/2026, 16:23:49" -> DD/MM/YYYY, HH:MM:SS
        try:
            return datetime.datetime.strptime(date_str, "%d/%m/%Y, %H:%M:%S")
        except Exception as e:
            logger.warning(f"Failed to parse date {date_str}: {e}")
            return None



    def cleanup(self, temp_path: str):
        cleanup_temp_files(temp_path)
