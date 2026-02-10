from groq import Groq
from config.settings import settings
from middleware.logger import logger
from typing import Optional

client = None
if settings.GROQ_API_KEY:
    client = Groq(api_key=settings.GROQ_API_KEY)

def generate_summary(prompt: str, system_prompt: str = "You are a helpful AI analyst.") -> Optional[str]:
    if not client:
        logger.warning("Groq client not initialized (missing key). Returning mock response.")
        return "Analysis unavailable: Groq API Key missing."
    
    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return f"Error generating summary: {str(e)}"

def generate_error_fallback_summary():
    return "The user is interested in technology, coding, and self-improvement. They watch a lot of tutorials and educational content."

def generate_avatar_persona(user_summary: str) -> str:
    """
    Generate the 'System Prompt' logic for the Avatar based on the user's profile.
    """
    prompt = f"""
    Based on the following user analysis, define a persona for the specific "AI Twin" of this user.
    The twin should mirror the user's documented anxieties, interests, and patterns.
    
    User Analysis:
    {user_summary}
    
    Output a system prompt description for this Avatar.
    """
    return generate_summary(prompt, system_prompt="You are an expert character creator.")
