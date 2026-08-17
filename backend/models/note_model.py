from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoteUpload(BaseModel):
    title: Optional[str] = None
    course_id: Optional[str] = None

class NoteInDB(BaseModel):
    id: str
    user_id: str
    title: str
    filename: str
    file_path: str
    status: str  # queued, processing, done, failed
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    page_count: Optional[int] = None
    error_message: Optional[str] = None

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    errors: list = []
