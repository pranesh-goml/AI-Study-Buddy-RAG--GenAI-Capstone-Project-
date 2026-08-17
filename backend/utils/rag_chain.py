import os
import requests
import time
from typing import List, Dict, Any
from utils.chroma_setup import query_vectorstore

def get_ollama_response(prompt: str, context: str, model: str = "phi3:latest") -> str:
    """
    Get response from local Ollama instance (100% free!)
    """
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    api_url = f"{ollama_url}/api/generate"
    
    full_prompt = f"""You are a helpful AI study assistant. Answer the question based on the provided context from the student's notes.

Context:
{context}

Question: {prompt}

Answer: Provide a clear, detailed answer based only on the context provided. If the context doesn't contain enough information, say so."""

    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 500
        }
    }
    
    try:
        print(f"🤖 Using Ollama {model}...")
        response = requests.post(api_url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get("response", "").strip()
            if answer:
                print(f"✅ Success with Ollama!")
                return answer
        else:
            print(f"❌ Ollama error: {response.status_code}")
            return None
    
    except requests.exceptions.ConnectionError:
        print("⚠️ Ollama not running. Please start Ollama and install a model.")
        return None
    except Exception as e:
        print(f"❌ Ollama exception: {str(e)}")
        return None


def get_huggingface_response(prompt: str, context: str) -> str:
    """
    Get response from HuggingFace (backup option)
    """
    hf_token = os.getenv("HF_API_TOKEN", "")
    
    if not hf_token or hf_token == "your_huggingface_token":
        return None
    
    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json"
    }
    
    # Try a simple, reliable model
    api_url = "https://api-inference.huggingface.co/models/google/flan-t5-base"
    
    full_prompt = f"""Context: {context[:1500]}

Question: {prompt}

Answer:"""

    payload = {
        "inputs": full_prompt,
        "parameters": {"max_length": 300}
    }
    
    try:
        print(f"🤖 Trying HuggingFace...")
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], dict):
                    answer = result[0].get("generated_text", "").strip()
                    if answer:
                        print(f"✅ Success with HuggingFace!")
                        return answer
        
        elif response.status_code == 503:
            print(f"⏳ HuggingFace model loading, please wait...")
            time.sleep(15)
            # Try one more time
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    if isinstance(result[0], dict):
                        answer = result[0].get("generated_text", "").strip()
                        if answer:
                            return answer
    
    except Exception as e:
        print(f"❌ HuggingFace failed: {str(e)}")
    
    return None


def get_ai_response(prompt: str, context: str) -> str:
    """
    Try multiple AI sources in priority order:
    1. Ollama (local, free, best)
    2. HuggingFace (API, limited)
    3. Fallback message with sources
    """
    # Try Ollama first (best option)
    answer = get_ollama_response(prompt, context)
    if answer:
        return answer
    
    # Try HuggingFace as backup
    answer = get_huggingface_response(prompt, context)
    if answer:
        return answer
    
    # If both fail, provide helpful message
    return """🤖 AI response unavailable right now.

**What happened?**
- Ollama is not running or not installed
- HuggingFace free API has limitations

**How to fix:**

**Option 1: Install Ollama (Recommended - 100% Free)**
1. Download from https://ollama.com/download
2. Run: `ollama pull phi3:mini`
3. Restart this server
4. Enjoy unlimited free AI answers!

See OLLAMA_SETUP.md for detailed instructions.

**Option 2: Just read the sources below**
The most relevant excerpts from your document are shown below - they contain the answer to your question!

**Option 3: Get HuggingFace Pro**
Upgrade at https://huggingface.co/pricing ($9/month)

I still retrieved the relevant information from your document - check the Sources section! 📚"""


def query_rag_system(note_id: str, user_id: str, question: str, top_k: int = 4) -> Dict[str, Any]:
    """
    Query the RAG system for a specific note
    
    Args:
        note_id: The ID of the note to query
        user_id: The ID of the user (for security)
        question: The user's question
        top_k: Number of relevant chunks to retrieve
    
    Returns:
        Dict with answer and sources
    """
    try:
        # Query the vector store
        results = query_vectorstore(note_id, question, n_results=top_k)
        
        if not results or not results.get("documents") or not results["documents"][0]:
            return {
                "answer": "I couldn't find any relevant information in your notes to answer this question. Try rephrasing or asking about a different topic.",
                "sources": []
            }
        
        # Extract context and sources
        context_parts = []
        sources = []
        
        documents = results["documents"][0]  # First query result
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        
        for i, (doc, metadata) in enumerate(zip(documents, metadatas)):
            context_parts.append(f"[Source {i+1}]: {doc}")
            
            sources.append({
                "page": str(metadata.get("page", "Unknown")),
                "content": doc[:200] + ("..." if len(doc) > 200 else ""),
                "relevance_rank": i + 1
            })
        
        # Combine all context
        full_context = "\n\n".join(context_parts)
        
        # Get answer from AI (tries Ollama first, then HuggingFace)
        answer = get_ai_response(question, full_context)
        
        return {
            "answer": answer,
            "sources": sources
        }
    
    except Exception as e:
        print(f"Error in RAG query: {str(e)}")
        return {
            "answer": f"An error occurred while processing your question: {str(e)}",
            "sources": []
        }


def generate_summary(note_id: str, user_id: str) -> str:
    """
    Generate a summary of the entire note
    """
    try:
        # Get a representative sample of chunks
        results = query_vectorstore(note_id, "main topics key concepts summary", n_results=5)
        
        if not results or not results.get("documents") or not results["documents"][0]:
            return "No content found in this document."
        
        # Combine content
        content = "\n\n".join(results["documents"][0])
        
        # Create summary prompt
        prompt = "Provide a concise summary of the main topics and key concepts"
        answer = get_ai_response(prompt, content)
        
        return answer
    
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return f"Error generating summary: {str(e)}"
