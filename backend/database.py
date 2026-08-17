"""
Database connection module
Centralized MongoDB connection to avoid circular imports
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")

client = None
db = None

def init_db():
    """Initialize database connection"""
    global client, db
    try:
        client = MongoClient(MONGO_URI)
        db = client.studybuddy
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        return db
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise

def get_db():
    """Get database instance"""
    global db
    if db is None:
        init_db()
    return db
