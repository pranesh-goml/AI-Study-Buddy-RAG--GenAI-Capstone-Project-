from pydantic import BaseModel
from typing import List, Optional

class Flashcard(BaseModel):
    """Single flashcard"""
    front: str  # Term or question
    back: str   # Definition or answer
    page_reference: Optional[str] = None
    difficulty: Optional[str] = "medium"

class FlashcardSetGenerateRequest(BaseModel):
    """Request to generate flashcards"""
    note_id: str
    num_cards: int = 10
    include_definitions: bool = True
    include_concepts: bool = True

class FlashcardSetResponse(BaseModel):
    """Response with generated flashcards"""
    set_id: str
    note_id: str
    title: str
    cards: List[Flashcard]
    created_at: str

class FlashcardReviewRequest(BaseModel):
    """User's flashcard review"""
    set_id: str
    card_index: int
    confidence: int  # 1-5 rating
    time_spent: int  # seconds

class FlashcardStats(BaseModel):
    """User's flashcard statistics"""
    set_id: str
    total_cards: int
    reviewed: int
    mastered: int
    needs_review: int
    average_confidence: float
