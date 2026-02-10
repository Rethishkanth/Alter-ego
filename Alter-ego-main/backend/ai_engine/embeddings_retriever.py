from typing import List, Dict, Any
from ai_engine.pinecone_client import pinecone_client
from ai_engine.embeddings import encode_text
from middleware.logger import logger

def search_relevant_posts(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search Pinecone for posts relevant to the query.
    """
    try:
        # 1. Encode query
        vector = encode_text(query)
        if not vector:
            return []
            
        # 2. Search Pinecone
        matches = pinecone_client.query(vector, top_k=top_k)
        
        # 3. Format results
        results = []
        for match in matches:
            results.append({
                "post_id": match.id,
                "score": match.score,
                "metadata": match.metadata
            })
            
        return results

    except Exception as e:
        logger.error(f"Search failed: {e}")
        return []
