from fastapi import APIRouter, HTTPException, Depends
from utils.jwt_handler import get_current_user
from database import get_db
import os
import shutil

router = APIRouter()

# Get database instance
db = get_db()
notes_collection = db["notes"]

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

@router.get("/")
def list_notes(user=Depends(get_current_user)):
    """Get all notes for the authenticated user"""
    user_id = user.get("user_id")
    
    notes = list(notes_collection.find({"user_id": user_id}))
    
    # Format response
    result = []
    for note in notes:
        result.append({
            "id": note["_id"],
            "title": note["title"],
            "filename": note["filename"],
            "status": note["status"],
            "uploaded_at": note["uploaded_at"].isoformat(),
            "page_count": note.get("page_count"),
            "course_id": note.get("course_id")
        })
    
    return result

@router.get("/{note_id}")
def get_note(note_id: str, user=Depends(get_current_user)):
    """Get details for a specific note"""
    user_id = user.get("user_id")
    
    note = notes_collection.find_one({"_id": note_id, "user_id": user_id})
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {
        "id": note["_id"],
        "title": note["title"],
        "filename": note["filename"],
        "status": note["status"],
        "uploaded_at": note["uploaded_at"].isoformat(),
        "processed_at": note.get("processed_at").isoformat() if note.get("processed_at") else None,
        "page_count": note.get("page_count"),
        "course_id": note.get("course_id"),
        "error_message": note.get("error_message")
    }

@router.delete("/{note_id}")
def delete_note(note_id: str, user=Depends(get_current_user)):
    """Delete a note and all associated data"""
    user_id = user.get("user_id")
    
    note = notes_collection.find_one({"_id": note_id, "user_id": user_id})
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Delete file
    try:
        if os.path.exists(note["file_path"]):
            os.remove(note["file_path"])
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete Chroma index
    try:
        chroma_path = os.path.join(CHROMA_PERSIST_DIR, note_id)
        if os.path.exists(chroma_path):
            shutil.rmtree(chroma_path)
    except Exception as e:
        print(f"Error deleting Chroma index: {e}")
    
    # Delete from MongoDB
    notes_collection.delete_one({"_id": note_id})
    
    return {"message": "Note deleted successfully"}
