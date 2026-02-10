import json
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import Dict, Any

from database import crud
from ai_engine.summarizer import client, settings
from middleware.logger import logger

def generate_autopsy_report(job_id: UUID, db: Session) -> Dict[str, Any]:
    """
    Generates a full psychological 'autopsy' report including:
    - Identity Card (Archetype)
    - Cognitive Biases (Radar Chart Data)
    - Drift Score (Self-Perception vs Reality)
    """
    
    # 1. Gather Data
    conversations = crud.get_all_conversations(db)
    analysis_results = crud.get_analysis_results(db, job_id)
    
    # Extract behavioral summary if available
    behavioral_summary = "No prior analysis found."
    for result in analysis_results:
        if result.analysis_type == 'behavioral_summary' and 'text' in result.result_data:
            behavioral_summary = result.result_data['text']
            break
            
    # Format chat history
    chat_history_text = "\n".join([f"User: {c.user_question}\nAvatar: {c.avatar_response}" for c in conversations[-20:]]) # Last 20 interactions
    
    if not client:
        return {
            "error": "LLM Client not initialized",
            "archetype": {"name": "The Unknown", "description": "Data insufficient."},
            "biases": [],
            "drift_score": 0.0
        }

    # 2. Construct Prompt
    system_prompt = """You are an expert psychoanalyst and data profiler. 
    Your goal is to perform a 'digital autopsy' on a user based on their social media consumption and chat interactions.
    
    Output strictly valid JSON with the following structure:
    {
        "archetype": {
            "name": "Title (e.g., The Passive Observer, The Outrage Merchant)",
            "description": "2-3 sentence ruthless but accurate description."
        },
        "biases": [
            {"name": "Narcissism", "score": 0-100},
            {"name": "Empathy", "score": 0-100},
            {"name": "Impulse", "score": 0-100},
            {"name": "Deception", "score": 0-100},
            {"name": "Validation", "score": 0-100},
            {"name": "Aggression", "score": 0-100}
        ],
        "drift_score": 0-100  // A number representing the gap between who they think they are vs who their data says they are.
    }
    """
    
    user_prompt = f"""
    Here is the behavioral analysis of the user's content consumption:
    {behavioral_summary}
    
    Here are their recent interactions with their AI twin:
    {chat_history_text}
    
    Generate the Autopsy Report now.
    """

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result_json = json.loads(completion.choices[0].message.content)
        
        # Save validation result
        crud.create_analysis_result(db, job_id, "autopsy_report", result_json)
        
        return result_json

    except Exception as e:
        logger.error(f"Autopsy generation failed: {e}")
        return {
            "error": str(e),
            "archetype": {"name": "The Glitch", "description": "Analysis failed due to system error."},
            "biases": [],
            "drift_score": 0
        }
