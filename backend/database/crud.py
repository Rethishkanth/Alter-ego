from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from database import models
from database.models import UploadMetadata, Post, AnalysisJob, AnalysisResult, Topic, Conversation

# --- Upload Metadata ---
def create_upload_metadata(db: Session, file_name: str, file_size: int) -> UploadMetadata:
    db_obj = UploadMetadata(file_name=file_name, file_size=file_size)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_upload_metadata(db: Session, upload_id: UUID, **kwargs) -> UploadMetadata:
    db_obj = db.query(UploadMetadata).filter(UploadMetadata.id == upload_id).first()
    if db_obj:
        for key, value in kwargs.items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

# --- Posts ---
def get_post_by_hash(db: Session, content_hash: str) -> Optional[Post]:
    return db.query(Post).filter(Post.content_hash == content_hash).first()

def create_post(db: Session, post_data: dict) -> Post:
    db_obj = Post(**post_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_all_posts(db: Session, skip: int = 0, limit: int = 10000) -> List[Post]:
    return db.query(Post).filter(Post.is_deleted == False).offset(skip).limit(limit).all()

# --- Analysis Jobs ---
def create_analysis_job(db: Session) -> AnalysisJob:
    db_obj = AnalysisJob()
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_latest_analysis_job(db: Session) -> Optional[AnalysisJob]:
    return db.query(AnalysisJob).order_by(AnalysisJob.created_at.desc()).first()

def update_analysis_job(db: Session, job_id: UUID, **kwargs) -> AnalysisJob:
    db_obj = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if db_obj:
        for key, value in kwargs.items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

# --- Analysis Results ---
def create_analysis_result(db: Session, job_id: UUID, analysis_type: str, result_data: dict) -> AnalysisResult:
    db_obj = AnalysisResult(
        analysis_job_id=job_id,
        analysis_type=analysis_type,
        result_data=result_data
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_analysis_results(db: Session, job_id: UUID) -> List[AnalysisResult]:
    return db.query(AnalysisResult).filter(AnalysisResult.analysis_job_id == job_id).all()

def get_analysis_result(db: Session, job_id: UUID, analysis_type: str) -> Optional[AnalysisResult]:
    return db.query(AnalysisResult).filter(
        AnalysisResult.analysis_job_id == job_id, 
        AnalysisResult.analysis_type == analysis_type
    ).first()

# --- Conversation ---
def create_conversation(db: Session, question: str, response: str, context_ids: list) -> Conversation:
    db_obj = Conversation(
        user_question=question,
        avatar_response=response,
        context_post_ids=context_ids
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_all_conversations(db: Session, skip: int = 0, limit: int = 100) -> List[Conversation]:
    return db.query(Conversation).order_by(Conversation.created_at.asc()).offset(skip).limit(limit).all()

def clear_all_data(db: Session):
    """
    Clear all data from the database to start fresh for a new upload.
    Deletes in order of dependency.
    """
    try:
        # Delete dependent tables first
        db.query(Conversation).delete()
        db.query(Topic).delete()
        db.query(AnalysisResult).delete()
        db.query(AnalysisJob).delete()
        
        # Delete core data
        db.query(Post).delete()
        db.query(UploadMetadata).delete()
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
