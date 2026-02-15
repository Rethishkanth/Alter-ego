from sqlalchemy.orm import Session
from uuid import UUID
from database import crud
from ai_engine import embeddings_retriever

def build_conversation_context(db: Session, job_id: UUID, query: str) -> str:
    """
    Construct the context prompt for the avatar based on:
    1. Analysis results (Persona, Summary)
    2. Relevant posts (RAG)
    """
    context_parts = []
    
    # 1. Fetch Persona & Analysis
    results = crud.get_analysis_results(db, job_id)
    persona_text = ""
    summary_text = ""
    
    for r in results:
        if r.analysis_type == "avatar_persona":
            persona_text = r.result_data.get("system_prompt", "")
        elif r.analysis_type == "behavioral_summary":
            summary_text = r.result_data.get("text", "")
            
    if persona_text:
        context_parts.append(f"SYSTEM INSTRUCTION (YOUR PERSONA):\n{persona_text}")
    
    if summary_text:
        context_parts.append(f"\nUSER BEHAVIORAL SUMMARY:\n{summary_text}")
        
    # 2. RAG - Find relevant posts
    relevant_items = embeddings_retriever.search_relevant_posts(query, top_k=3)
    
    if relevant_items:
        evidence_text = "\nRELEVANT WATCH HISTORY (Use as evidence):\n"
        for item in relevant_items:
            meta = item['metadata']
            evidence_text += f"- '{meta.get('title')}' by {meta.get('channel')} (Date: {meta.get('date')})\n"
        context_parts.append(evidence_text)
        
    return "\n".join(context_parts), relevant_items
