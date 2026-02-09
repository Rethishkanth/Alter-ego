from sqlalchemy.orm import Session
from uuid import UUID
import asyncio
from datetime import datetime

from database import crud
from ai_engine import sentiment, embeddings, clustering, summarizer, pinecone_client
from middleware.logger import logger
from websocket.connection_manager import manager
from websocket.events import WSMessage, ANALYSIS_STARTED, ANALYSIS_PROGRESS, ANALYSIS_COMPLETE

async def run_analysis_pipeline(job_id: UUID, db: Session):
    try:
        # 0. Notify Start
        crud.update_analysis_job(db, job_id, status='in_progress', started_at=datetime.utcnow())
        await manager.broadcast(WSMessage(type=ANALYSIS_STARTED, data={"job_id": str(job_id)}))
        
        # 1. Fetch Data
        posts = crud.get_all_posts(db)
        if not posts:
            logger.warning("No posts found for analysis.")
            crud.update_analysis_job(db, job_id, status='failed', error_message="No posts to analyze")
            return

        titles = [p.title for p in posts]
        logger.info(f"Starting analysis for {len(posts)} posts")

        # 2. Sentiment Analysis
        logger.info("Running sentiment analysis...")
        sentiments = sentiment.analyze_sentiment(titles)
        # Store sentiment results (simplified for MVP: just keeping aggregate stats/timeseries later)
        # For now, let's just calculate average
        pos_score = sum(1 for s in sentiments if s['label'] == 'POSITIVE') / len(sentiments)
        avg_sentiment = {"positive_ratio": pos_score, "count": len(sentiments)}
        crud.create_analysis_result(db, job_id, "sentiment_summary", avg_sentiment)
        await manager.broadcast(WSMessage(type=ANALYSIS_PROGRESS, message="Sentiment analysis complete"))
        
        # 3. Embeddings & Pinecone
        logger.info("Generating embeddings...")
        vectors = embeddings.generate_embeddings(titles)
        
        # Prepare for Pinecone
        pinecone_vectors = []
        for i, post in enumerate(posts):
            vector_list = vectors[i].tolist()
            metadata = {"title": post.title, "channel": post.channel_name, "date": str(post.watch_date)}
            pinecone_vectors.append((str(post.id), vector_list, metadata))
        
        success = pinecone_client.pinecone_client.upsert_vectors(pinecone_vectors)
        if success:
            logger.info("Embeddings uploaded to Pinecone")
        await manager.broadcast(WSMessage(type=ANALYSIS_PROGRESS, message="Embeddings generated and synced"))

        # 4. Clustering
        logger.info("Running topic clustering...")
        clusters = clustering.cluster_posts(titles)
        # Save topics
        for cluster_id, data in clusters.items():
            db_topic = crud.models.Topic(
                analysis_job_id=job_id,
                topic_name=f"Topic {cluster_id}", # Could use GPT to name these better
                confidence_score=1.0,
                post_ids=data['indices'], # This needs to be mapped back to DB IDs if indices match 'posts' list order
                post_count=data['count']
            )
            db.add(db_topic)
        db.commit()
        await manager.broadcast(WSMessage(type=ANALYSIS_PROGRESS, message="Topic clustering complete"))

        # 5. Summarization (GPT-4)
        logger.info("Generating AI summaries...")
        # Construct a prompt based on clusters
        cluster_summary = "\n".join([f"Cluster {k}: {', '.join(v['keywords'])}" for k, v in clusters.items()])
        summary_prompt = f"Analyze these video clusters from a user's watch history:\n{cluster_summary}\n\nWhat are the key behavioral patterns?"
        
        behavioral_summary = summarizer.generate_summary(summary_prompt)
        crud.create_analysis_result(db, job_id, "behavioral_summary", {"text": behavioral_summary})
        
        persona_prompt = summarizer.generate_avatar_persona(behavioral_summary)
        crud.create_analysis_result(db, job_id, "avatar_persona", {"system_prompt": persona_prompt})
        
        await manager.broadcast(WSMessage(type=ANALYSIS_PROGRESS, message="AI summaries generated"))

        # 6. Complete
        crud.update_analysis_job(db, job_id, status='completed', completed_at=datetime.utcnow())
        await manager.broadcast(WSMessage(type=ANALYSIS_COMPLETE, data={"job_id": str(job_id)}))
        logger.info(f"Analysis job {job_id} completed successfully.")

    except Exception as e:
        logger.error(f"Analysis job failed: {e}", exc_info=True)
        crud.update_analysis_job(db, job_id, status='failed', error_message=str(e))
