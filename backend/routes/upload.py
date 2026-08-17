from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi import Form
from utils.jwt_handler import get_current_user
from utils.pdf_parser import extract_text_from_pdf, extract_text_from_txt
from utils.chroma_setup import create_text_chunks, index_documents
from models.note_model import JobStatus
from database import get_db
import os
import uuid
import shutil
from datetime import datetime

router = APIRouter()

# Get database instance
db = get_db()
notes_collection = db["notes"]
jobs_collection = db["jobs"]

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_file(filename: str, file_size: int):
    """Validate file type and size"""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}")
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: 50MB")

def process_file_background(job_id: str, note_id: str, file_path: str, user_id: str, filename: str):
    """Background task to process uploaded file"""
    try:
        # Update job status to processing
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"status": "processing", "progress": 10}}
        )
        
        # Extract text based on file type
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            pages_content = extract_text_from_pdf(file_path)
        else:
            pages_content = extract_text_from_txt(file_path)
        
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"progress": 30}}
        )
        
        # Create chunks
        documents = create_text_chunks(pages_content, note_id, user_id)
        
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"progress": 60}}
        )
        
        # Index into Chroma
        index_documents(documents, note_id)
        
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"progress": 90}}
        )
        
        # Update note status
        notes_collection.update_one(
            {"_id": note_id},
            {"$set": {
                "status": "done",
                "processed_at": datetime.utcnow(),
                "page_count": len(pages_content)
            }}
        )
        
        # Mark job as complete
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"status": "done", "progress": 100}}
        )
        
    except Exception as e:
        # Update job and note with error
        error_msg = str(e)
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"status": "failed", "errors": [error_msg]}}
        )
        notes_collection.update_one(
            {"_id": note_id},
            {"$set": {"status": "failed", "error_message": error_msg}}
        )

@router.post("/")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    course_id: str = Form(None),
    user=Depends(get_current_user)
):
    """
    Upload a PDF or text file for processing.
    File will be parsed, chunked, and indexed into vector store.
    """
    user_id = user.get("user_id")
    
    # Create temp directory if it doesn't exist
    temp_dir = os.path.join(UPLOAD_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Validate file
    file_size = 0
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    
    with open(temp_path, "wb") as buffer:
        content = await file.read()
        file_size = len(content)
        buffer.write(content)
    
    validate_file(file.filename, file_size)
    
    # Generate IDs
    note_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())
    
    # Save file to uploads directory
    user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_path = os.path.join(user_upload_dir, f"{note_id}_{file.filename}")
    shutil.move(temp_path, file_path)
    
    # Create note record
    note_title = title or file.filename
    note_doc = {
        "_id": note_id,
        "user_id": user_id,
        "title": note_title,
        "filename": file.filename,
        "file_path": file_path,
        "status": "queued",
        "uploaded_at": datetime.utcnow(),
        "course_id": course_id
    }
    notes_collection.insert_one(note_doc)
    
    # Create job record
    job_doc = {
        "_id": job_id,
        "note_id": note_id,
        "status": "queued",
        "progress": 0,
        "errors": []
    }
    jobs_collection.insert_one(job_doc)
    
    # Start background processing
    background_tasks.add_task(process_file_background, job_id, note_id, file_path, user_id, file.filename)
    
    return {"job_id": job_id, "note_id": note_id, "message": "File uploaded successfully. Processing started."}

@router.get("/status/{job_id}")
def get_job_status(job_id: str, user=Depends(get_current_user)):
    """Check the status of a file processing job"""
    job = jobs_collection.find_one({"_id": job_id})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "errors": job.get("errors", [])
    }
