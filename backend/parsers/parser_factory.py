from .youtube_parser import YouTubeParser
from .base_parser import BaseParser

class ParserFactory:
    @staticmethod
    def get_parser(file_type: str) -> BaseParser:
        if file_type == "youtube":
            return YouTubeParser()
        else:
            raise ValueError(f"No parser available for type: {file_type}")
