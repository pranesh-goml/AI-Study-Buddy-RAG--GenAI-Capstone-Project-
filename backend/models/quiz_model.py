from pydantic import BaseModel
from typing import List, Optional

class QuizOption(BaseModel):
    text: str
    is_correct: bool

class QuizQuestion(BaseModel):
    """Single quiz question"""
    question: str
    options: List[QuizOption]
    explanation: str
    page_reference: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    """Request to generate a quiz"""
    note_id: str
    num_questions: int = 5
    difficulty: str = "medium"  # easy, medium, hard

class QuizGenerateResponse(BaseModel):
    """Response with generated quiz"""
    quiz_id: str
    note_id: str
    title: str
    questions: List[QuizQuestion]
    created_at: str

class QuizSubmitRequest(BaseModel):
    """User's quiz submission"""
    quiz_id: str
    answers: List[int]  # List of selected option indices

class QuizSubmitResponse(BaseModel):
    """Quiz results"""
    quiz_id: str
    score: int
    total: int
    percentage: float
    results: List[dict]  # Detailed results per question
