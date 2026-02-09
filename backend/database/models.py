from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from config.database import Base

class UploadMetadata(Base):
    __tablename__ = "upload_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    total_posts_in_file = Column(Integer, default=0)
    upload_status = Column(String, default='parsing') # parsing, completed, failed
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    posts_successfully_parsed = Column(Integer, default=0)
    posts_skipped = Column(Integer, default=0)
    parsed_at = Column(DateTime, nullable=True)

class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String, default='youtube')
    platform_post_id = Column(String, nullable=True)
    content_type = Column(String, nullable=True) # video, comment, like
    title = Column(String, nullable=False)
    channel_name = Column(String, nullable=True)
    watch_date = Column(DateTime, nullable=True)
    content_hash = Column(String, unique=True, index=True, nullable=False)
    video_metadata = Column(JSONB, nullable=True) # Renamed from 'metadata'
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    sentiment_timeseries = relationship("SentimentTimeseries", back_populates="post")
    pinecone_vector = relationship("PineconeVector", back_populates="post", uselist=False)

class SentimentTimeseries(Base):
    __tablename__ = "sentiment_timeseries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"))
    sentiment_score = Column(Float, nullable=False)
    sentiment_label = Column(String, nullable=False)
    date_bucket = Column(DateTime, nullable=False)
    day_of_week = Column(String, nullable=False)
    hour_of_day = Column(Integer, nullable=False)

    post = relationship("Post", back_populates="sentiment_timeseries")

class PineconeVector(Base):
    __tablename__ = "pinecone_vectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), unique=True)
    pinecone_vector_id = Column(String, nullable=False)
    embedding_model = Column(String, default='bert')
    embedding_dimension = Column(Integer, default=384)
    is_synced = Column(Boolean, default=True)
    synced_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="pinecone_vector")

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type = Column(String, default='full_analysis')
    status = Column(String, default='pending') # pending, in_progress, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    analysis_results = relationship("AnalysisResult", back_populates="analysis_job")
    topics = relationship("Topic", back_populates="analysis_job")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id"))
    analysis_type = Column(String, nullable=False) # sentiment_summary, interest_summary, mood_trends, personality
    result_data = Column(JSONB, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    analysis_job = relationship("AnalysisJob", back_populates="analysis_results")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id"))
    topic_name = Column(String, nullable=False)
    topic_description = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    post_ids = Column(JSONB, nullable=True) # Array of post IDs belonging to this topic
    post_count = Column(Integer, default=0)

    analysis_job = relationship("AnalysisJob", back_populates="topics")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_question = Column(Text, nullable=False)
    avatar_response = Column(Text, nullable=False)
    context_post_ids = Column(JSONB, nullable=True) # Array of post IDs used as context
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
