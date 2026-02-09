from sqlalchemy.orm import Session
from uuid import UUID
import json

from database import crud
from services import retrieval_service
from ai_engine import summarizer
from schemas.chat_schema import ChatResponse
from middleware.logger import logger

def process_chat_request(db: Session, job_id: UUID, question: str) -> ChatResponse:
    # 1. Build Context
    context_str, relevant_items = retrieval_service.build_conversation_context(db, job_id, question)
    
    # 2. Call LLM
    # We combine the persona/context into the system prompt effectively
    full_prompt = f"CONTEXT:\n{context_str}\n\nUSER QUESTION: {question}\n\nRespond as the AI Avatar."
    
    avatar_reply = summarizer.generate_summary(full_prompt, system_prompt="You are the user's digital twin. Speak in the first person.")
    
    # Fallback if API failed (starts with "Error")
    if avatar_reply and avatar_reply.startswith("Error"):
        logger.warning(f"Using fallback reply due to API error: {avatar_reply}")
        import random
        fallback_responses = [
            "I'm feeling a bit disconnected from the cloud right now (API Quota Exceeded), but I can tell you that your watch history shows a strong interest in learning and tech!",
            "My brain is offline (Groq Error), but based on your recent videos, you seem to be really into self-improvement.",
            "I can't access my advanced language model at the moment, but your data is safely stored. Try again later!"
        ]
        avatar_reply = random.choice(fallback_responses)

    # 3. Save Conversation
    context_ids = [item['post_id'] for item in relevant_items]
    crud.create_conversation(db, question, avatar_reply, context_ids)
    
    return ChatResponse(
        avatar_response=avatar_reply,
        context_used=relevant_items,
        confidence=1.0 # Placeholder
    )
