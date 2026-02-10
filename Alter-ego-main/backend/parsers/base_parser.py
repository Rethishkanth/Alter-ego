from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseParser(ABC):
    """
    Abstract base class for all social media data parsers.
    """
    
    @abstractmethod
    def parse(self, temp_path: str) -> List[Dict[str, Any]]:
        """
        Parse the data from the given temporary path (extracted zip directory).
        Returns a list of normalized post dictionaries.
        """
        pass

    @abstractmethod
    def cleanup(self, temp_path: str):
        """
        Clean up any temporary files or directories created during parsing.
        """
        pass
