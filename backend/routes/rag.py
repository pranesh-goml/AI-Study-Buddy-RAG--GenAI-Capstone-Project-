from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from utils.jwt_handler import get_current_user
from utils.rag_chain import query_rag_system, generate_summary
from database import get_db

router = APIRouter()

# Get database instance
db = get_db()


class QuestionRequest(BaseModel):
    note_id: str
    question: str


class SourceInfo(BaseModel):
    page: str
    content: str
    relevance_rank: int


class AnswerResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
    note_id: str
    question: str


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    request: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Ask a question about a specific note using RAG
    """
    user_id = current_user["user_id"]
    
    # Verify the note belongs to the user
    note = db.notes.find_one({
        "_id": request.note_id,
        "user_id": user_id
    })
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.get("status") != "done":
        raise HTTPException(
            status_code=400, 
            detail="This note is still being processed. Please wait until processing is complete."
        )
    
    # Query the RAG system
    result = query_rag_system(
        note_id=request.note_id,
        user_id=user_id,
        question=request.question
    )
    
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "note_id": request.note_id,
        "question": request.question
    }


@router.post("/summary/{note_id}")
async def get_summary(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a summary of a note
    """
    user_id = current_user["user_id"]
    
    # Verify the note belongs to the user
    note = db.notes.find_one({
        "_id": note_id,
        "user_id": user_id
    })
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.get("status") != "done":
        raise HTTPException(
            status_code=400, 
            detail="This note is still being processed."
        )
    
    # Generate summary
    summary = generate_summary(note_id=note_id, user_id=user_id)
    
    return {
        "note_id": note_id,
        "summary": summary
    }
