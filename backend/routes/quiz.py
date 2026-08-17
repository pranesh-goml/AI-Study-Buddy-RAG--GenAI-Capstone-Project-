from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import uuid
from models.quiz_model import (
    QuizGenerateRequest, QuizGenerateResponse, 
    QuizSubmitRequest, QuizSubmitResponse,
    QuizQuestion
)
from utils.jwt_handler import get_current_user
from utils.quiz_generator import generate_quiz_questions, validate_quiz_answers
from database import get_db

router = APIRouter()

@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a quiz from a note using AI
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
        
        # Generate quiz questions
        questions = generate_quiz_questions(
            request.note_id, 
            request.num_questions,
            request.difficulty
        )
        
        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate quiz questions")
        
        # Create quiz record
        quiz_id = str(uuid.uuid4())
        quiz_doc = {
            "_id": quiz_id,
            "user_id": user_id,
            "note_id": request.note_id,
            "title": f"Quiz: {note.get('filename', 'Unknown')}",
            "questions": questions,
            "num_questions": len(questions),
            "difficulty": request.difficulty,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.quizzes.insert_one(quiz_doc)
        
        # Convert to response model
        quiz_questions = [
            QuizQuestion(**q) for q in questions
        ]
        
        return QuizGenerateResponse(
            quiz_id=quiz_id,
            note_id=request.note_id,
            title=quiz_doc["title"],
            questions=quiz_questions,
            created_at=quiz_doc["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")


@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    request: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit quiz answers and get results
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        # Get quiz
        quiz = db.quizzes.find_one({"_id": request.quiz_id, "user_id": user_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Validate answers
        results = validate_quiz_answers(quiz["questions"], request.answers)
        
        # Save quiz attempt
        attempt_id = str(uuid.uuid4())
        attempt_doc = {
            "_id": attempt_id,
            "quiz_id": request.quiz_id,
            "user_id": user_id,
            "answers": request.answers,
            "score": results["score"],
            "total": results["total"],
            "percentage": results["percentage"],
            "submitted_at": datetime.utcnow().isoformat()
        }
        
        db.quiz_attempts.insert_one(attempt_doc)
        
        return QuizSubmitResponse(
            quiz_id=request.quiz_id,
            score=results["score"],
            total=results["total"],
            percentage=results["percentage"],
            results=results["results"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific quiz
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        quiz = db.quizzes.find_one({"_id": quiz_id, "user_id": user_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Remove MongoDB _id from nested documents
        quiz["quiz_id"] = quiz.pop("_id")
        
        return quiz
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/note/{note_id}/quizzes")
async def get_note_quizzes(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all quizzes for a specific note
    """
    try:
        user_id = current_user["user_id"]
        db = get_db()
        
        quizzes = list(db.quizzes.find(
            {"note_id": note_id, "user_id": user_id}
        ).sort("created_at", -1))
        
        # Convert to response format
        for quiz in quizzes:
            quiz["quiz_id"] = quiz.pop("_id")
        
        return {"quizzes": quizzes}
    
    except Exception as e:
        print(f"Error fetching quizzes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
