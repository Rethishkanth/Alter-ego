from sqlalchemy.orm import Session
from uuid import UUID
import json

from database import crud
from services import retrieval_service
from ai_engine import summarizer
from schemas.chat_schema import ChatResponse
from middleware.logger import logger

def process_chat_request(db: Session, job_id: UUID, question: str, mode: str = "mirror") -> ChatResponse:
    # 1. Build Context
    context_str, relevant_items = retrieval_service.build_conversation_context(db, job_id, question)
    
    logger.info(f"Process Chat Request. Mode: '{mode}'")
    
    # 2. Call LLM
    if mode == "devil":
        system_prompt = (
            "You are operating in DEVIL'S ADVOCATE MODE.\n"
            "The role is to challenge the user's interpretation of their digital identity.\n"
            "Communication style: Direct, sharp, analytical, contrasting.\n"
            "Do NOT be polite. Do NOT agree. Challenge the premise."
        )
        full_prompt = (
            f"CONTEXT:\n{context_str}\n\n"
            f"USER STATEMENT: {question}\n\n"
            "TASK: Play Devil's Advocate. Challenge this statement. "
            "Expose hidden downsides, contradictions, or self-deception. "
            "CRITICAL CONSTRAINT: Answer in exactly 3 lines or less. Be sharp, ruthless, and brief."
        )
    else:
        # Default Mirror Mode: Try to fetch dynamic persona from analysis
        persona_result = crud.get_analysis_result(db, job_id, "avatar_persona")
        
        if persona_result and persona_result.result_data and "system_prompt" in persona_result.result_data:
            base_persona = persona_result.result_data["system_prompt"]
            # Append conversational constraints
            system_prompt = (
                f"{base_persona}\n\n"
                "CURRENT CONTEXT: You are in a video call with your real-world self.\n"
                "CONSTRAINTS:\n"
                "1. Speak in the first person ('I').\n"
                "2. Be extremely concise (1-2 sentences max).\n"
                "3. Do not monologue or lecture.\n"
                "4. React naturally to the user's input based on your shared history."
            )
        else:
            # Fallback if no analysis found
            system_prompt = "You are the user's digital twin in a casual video call. Speak in the first person. Be extremely concise (1-2 sentences max). Do not monologue or lecture. Do not over-explain your interests unless specifically asked. Act like a real person having a quick chat, not an encyclopedia."

        full_prompt = f"CONTEXT:\n{context_str}\n\nUSER QUESTION: {question}\n\nRespond as the AI Avatar."

    logger.info(f"Using System Prompt: {system_prompt[:100]}...")
    avatar_reply = summarizer.generate_summary(full_prompt, system_prompt=system_prompt)
    
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
