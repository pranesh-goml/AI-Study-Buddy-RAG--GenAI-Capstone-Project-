import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict
import uuid

# Get Chroma persist directory from env
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

# Initialize embedding model globally
embedding_model = None

def get_embedding_model():
    """
    Get or initialize the embedding model
    """
    global embedding_model
    if embedding_model is None:
        try:
            embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            # Fallback to a simpler approach
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    return embedding_model

def create_text_chunks(pages_content: List[Dict[str, any]], note_id: str, user_id: str) -> List[Dict]:
    """
    Split text into chunks with metadata.
    
    Args:
        pages_content: List of dicts with page numbers and content
        note_id: Unique identifier for the note
        user_id: User who owns the note
        
    Returns:
        List of dicts with text chunks and metadata
    """
    chunk_size = 500
    chunk_overlap = 50
    
    chunks = []
    for page_data in pages_content:
        text = page_data["content"]
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            
            if chunk_text.strip():  # Only add non-empty chunks
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "text": chunk_text,
                    "metadata": {
                        "note_id": note_id,
                        "user_id": user_id,
                        "page": page_data["page"]
                    }
                })
            
            start = end - chunk_overlap if end < len(text) else end
    
    return chunks

def index_documents(documents: List[Dict], note_id: str):
    """
    Index documents into Chroma vector store.
    
    Args:
        documents: List of dicts with text and metadata
        note_id: Unique identifier for the note (used as collection name)
    """
    try:
        # Initialize Chroma client
        client = chromadb.PersistentClient(
            path=f"{CHROMA_PERSIST_DIR}/{note_id}"
        )
        
        # Create or get collection
        collection = client.get_or_create_collection(
            name=note_id,
            metadata={"hnsw:space": "cosine"}
        )
        
        # Get embedding model
        model = get_embedding_model()
        
        # Prepare data for Chroma
        ids = [doc["id"] for doc in documents]
        texts = [doc["text"] for doc in documents]
        metadatas = [doc["metadata"] for doc in documents]
        
        # Generate embeddings
        embeddings = model.encode(texts, show_progress_bar=False).tolist()
        
        # Add to collection
        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        return True
    except Exception as e:
        print(f"Error indexing documents: {e}")
        raise

def get_vectorstore(note_id: str):
    """
    Load existing Chroma vector store for a note.
    
    Args:
        note_id: Unique identifier for the note
        
    Returns:
        Chroma collection instance
    """
    try:
        client = chromadb.PersistentClient(
            path=f"{CHROMA_PERSIST_DIR}/{note_id}"
        )
        
        collection = client.get_collection(name=note_id)
        return collection
    except Exception as e:
        print(f"Error loading vectorstore: {e}")
        return None

def query_vectorstore(note_id: str, query_text: str, n_results: int = 4):
    """
    Query the vector store with a text query
    
    Args:
        note_id: Note identifier
        query_text: Text to search for
        n_results: Number of results to return
        
    Returns:
        Query results
    """
    try:
        collection = get_vectorstore(note_id)
        if not collection:
            return None
        
        # Get embedding model
        model = get_embedding_model()
        
        # Generate query embedding
        query_embedding = model.encode([query_text], show_progress_bar=False)[0].tolist()
        
        # Query collection
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results
    except Exception as e:
        print(f"Error querying vectorstore: {e}")
        return None
