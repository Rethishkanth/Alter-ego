from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from typing import List, Dict
from middleware.logger import logger

# Using simple K-Means + TF-IDF for MVP stability instead of heavy BERTopic
# BERTopic handles dependencies and UMAP/HDBSCAN which can be tricky in some envs

def cluster_posts(texts: List[str], n_clusters: int = 5) -> Dict[int, Dict]:
    """
    Cluster texts into n_clusters.
    Returns: {
        cluster_id: {
            'keywords': ['word1', 'word2'],
            'indices': [0, 5, 12...]
        }
    }
    """
    try:
        if not texts:
            return {}
            
        # 1. Vectorize
        vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        X = vectorizer.fit_transform(texts)
        
        # 2. Cluster
        kmeans = KMeans(n_clusters=min(n_clusters, len(texts)), random_state=42)
        kmeans.fit(X)
        labels = kmeans.labels_
        
        # 3. Extract keywords per cluster
        # Get centroids -> inverse transform to find top words?
        # Simpler: For each cluster, get top TF-IDF terms
        feature_names = vectorizer.get_feature_names_out()
        
        clusters = {}
        for i in range(n_clusters):
            indices = np.where(labels == i)[0].tolist()
            if not indices:
                continue
                
            # Get centroid for this cluster
            centroid = kmeans.cluster_centers_[i]
            # Top 5 words
            top_indices = centroid.argsort()[-5:][::-1]
            keywords = [feature_names[ind] for ind in top_indices]
            
            clusters[i] = {
                "keywords": keywords,
                "indices": indices,
                "count": len(indices)
            }
            
        return clusters

    except Exception as e:
        logger.error(f"Clustering failed: {e}")
        return {}
