
# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from routes import auth, upload, rag, quiz, flashcards, notes
import os

app = FastAPI()

# Initialize database connection
try:
    init_db()
except Exception as e:
    print(f"Warning: Failed to initialize database: {e}")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(rag.router, prefix="/rag", tags=["rag"])
app.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
app.include_router(flashcards.router, prefix="/flashcards", tags=["flashcards"])

@app.get("/health")
def health():
    return {"status": "ok"}

# MongoDB connection health check
from pymongo import errors
from fastapi import Response, status as http_status

@app.get("/mongo-health")
def mongo_health(response: Response):
    try:
        db = get_db()
        db.command('ping')
        return {"mongodb": "connected"}
    except errors.PyMongoError as e:
        response.status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE
        return {"mongodb": "disconnected", "error": str(e)}

