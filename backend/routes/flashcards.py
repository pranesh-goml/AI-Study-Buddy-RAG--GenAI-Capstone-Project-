from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import uuid
from models.flashcard_model import (
    FlashcardSetGenerateRequest, FlashcardSetResponse,
    FlashcardReviewRequest, FlashcardStats,
    Flashcard
)
from utils.jwt_handler import get_current_user
from utils.flashcard_generator import generate_flashcards, calculate_flashcard_stats
from database import get_db

router = APIRouter()

@router.post("/generate", response_model=FlashcardSetResponse)
async def generate_flashcard_set(
    request: FlashcardSetGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate flashcards from a note using AI
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        # Verify note exists and belongs to user
        note = db.notes.find_one({"_id": request.note_id, "user_id": user_id})
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        if note.get("status") != "done":
            raise HTTPException(status_code=400, detail="Note is still processing")
        
        # Generate flashcards
        cards = generate_flashcards(
            request.note_id,
            request.num_cards,
            request.include_definitions,
            request.include_concepts
        )
        
        if not cards:
            raise HTTPException(status_code=500, detail="Failed to generate flashcards")
        
        # Create flashcard set record
        set_id = str(uuid.uuid4())
        set_doc = {
            "_id": set_id,
            "user_id": user_id,
            "note_id": request.note_id,
            "title": f"Flashcards: {note.get('filename', 'Unknown')}",
            "cards": cards,
            "num_cards": len(cards),
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.flashcard_sets.insert_one(set_doc)
        
        # Convert to response model
        flashcards = [Flashcard(**card) for card in cards]
        
        return FlashcardSetResponse(
            set_id=set_id,
            note_id=request.note_id,
            title=set_doc["title"],
            cards=flashcards,
            created_at=set_doc["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating flashcards: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


@router.post("/review")
async def review_flashcard(
    request: FlashcardReviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Record a flashcard review
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        # Verify flashcard set exists
        flashcard_set = db.flashcard_sets.find_one({"_id": request.set_id, "user_id": user_id})
        if not flashcard_set:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        
        # Record review
        review_id = str(uuid.uuid4())
        review_doc = {
            "_id": review_id,
            "set_id": request.set_id,
            "user_id": user_id,
            "card_index": request.card_index,
            "confidence": request.confidence,
            "time_spent": request.time_spent,
            "reviewed_at": datetime.utcnow().isoformat()
        }
        
        db.flashcard_reviews.insert_one(review_doc)
        
        return {"message": "Review recorded successfully", "review_id": review_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error recording review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{set_id}", response_model=FlashcardSetResponse)
async def get_flashcard_set(
    set_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific flashcard set
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        flashcard_set = db.flashcard_sets.find_one({"_id": set_id, "user_id": user_id})
        if not flashcard_set:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        
        # Convert to response model
        flashcards = [Flashcard(**card) for card in flashcard_set["cards"]]
        
        return FlashcardSetResponse(
            set_id=flashcard_set["_id"],
            note_id=flashcard_set["note_id"],
            title=flashcard_set["title"],
            cards=flashcards,
            created_at=flashcard_set["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching flashcard set: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{set_id}/stats", response_model=FlashcardStats)
async def get_flashcard_stats(
    set_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get statistics for a flashcard set
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        # Verify set exists
        flashcard_set = db.flashcard_sets.find_one({"_id": set_id, "user_id": user_id})
        if not flashcard_set:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        
        # Get all reviews for this set
        reviews = list(db.flashcard_reviews.find({"set_id": set_id, "user_id": user_id}))
        
        # Calculate stats
        stats = calculate_flashcard_stats(reviews)
        stats["set_id"] = set_id
        stats["total_cards"] = flashcard_set["num_cards"]
        
        return FlashcardStats(**stats)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/note/{note_id}/sets")
async def get_note_flashcard_sets(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all flashcard sets for a specific note
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        sets = list(db.flashcard_sets.find(
            {"note_id": note_id, "user_id": user_id}
        ).sort("created_at", -1))
        
        # Convert to response format
        for s in sets:
            s["set_id"] = s.pop("_id")
            # Don't include full cards list in summary
            s["num_cards"] = len(s.get("cards", []))
            s.pop("cards", None)
        
        return {"sets": sets}
    
    except Exception as e:
        print(f"Error fetching flashcard sets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
