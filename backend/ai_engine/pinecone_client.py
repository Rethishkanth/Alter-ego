import os
from config.settings import settings
from middleware.logger import logger
from typing import List, Dict, Any

class PineconeClient:
    def __init__(self):
        self.api_key = settings.PINECONE_API_KEY
        self.index_name = "youtube-avatar-index"
        self.pc = None
        self.index = None
        
        if self.api_key:
            try:
                from pinecone import Pinecone, ServerlessSpec
            except ImportError:
                logger.warning("pinecone package not available, Pinecone features disabled.")
                return
            try:
                self.pc = Pinecone(api_key=self.api_key)
                # Check if index exists, if not create (for MVP simplicity)
                # Note: creating index takes time, ideally should be pre-created
                existing_indexes = [i.name for i in self.pc.list_indexes()]
                if self.index_name not in existing_indexes:
                    logger.info(f"Creating Pinecone index: {self.index_name}")
                    self.pc.create_index(
                        name=self.index_name,
                        dimension=384, # Matches all-MiniLM-L6-v2
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region="us-east-1"
                        )
                    )
                self.index = self.pc.Index(self.index_name)
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone: {e}")

    def upsert_vectors(self, vectors: List[tuple]):
        """
        vectors format: [(id, embedding_list, metadata_dict), ...]
        """
        if not self.index:
            logger.warning("Pinecone index not initialized, skipping upsert.")
            return False
        
        try:
            # Upsert in batches of 100
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i+batch_size]
                self.index.upsert(vectors=batch)
            return True
        except Exception as e:
            logger.error(f"Pinecone upsert failed: {e}")
            return False

    def query(self, vector: List[float], top_k: int = 5) -> List[Any]:
        if not self.index:
            return []
        try:
            results = self.index.query(vector=vector, top_k=top_k, include_metadata=True)
            return results.matches
        except Exception as e:
            logger.error(f"Pinecone query failed: {e}")
            return []

    def clear_index(self):
        """Delete all vectors in the index"""
        if not self.index:
            return False
        try:
            self.index.delete(delete_all=True)
            logger.info("Pinecone index cleared.")
            return True
        except Exception as e:
            logger.error(f"Pinecone clear failed: {e}")
            return False

# Singleton instance
pinecone_client = PineconeClient()
