import os
import json
import requests
from typing import List, Dict, Any
from utils.chroma_setup import query_vectorstore

def get_ollama_response_for_flashcards(prompt: str, context: str, model: str = "phi3:latest") -> str:
    """
    Get flashcards from Ollama
    """
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    api_url = f"{ollama_url}/api/generate"
    
    full_prompt = f"""You are a flashcard generator. Extract key terms, concepts, and definitions from the provided context.

Context from study materials:
{context}

{prompt}

IMPORTANT: Respond ONLY with valid JSON. No other text before or after. Format:
{{
  "cards": [
    {{
      "front": "Term or concept",
      "back": "Definition or explanation",
      "page_reference": "Page X",
      "difficulty": "easy"
    }}
  ]
}}"""

    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.6,
            "num_predict": 2000
        }
    }
    
    try:
        print(f"🎴 Generating flashcards with Ollama {model}...")
        response = requests.post(api_url, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get("response", "").strip()
            if answer:
                print(f"✅ Flashcards generated successfully!")
                return answer
        else:
            print(f"❌ Ollama error: {response.status_code}")
            return None
    
    except Exception as e:
        print(f"❌ Flashcard generation error: {str(e)}")
        return None


def generate_flashcards(note_id: str, num_cards: int = 10, include_definitions: bool = True, 
                       include_concepts: bool = True) -> List[Dict[str, Any]]:
    """
    Generate flashcards from a note
    """
    try:
        # Get relevant content from the note
        search_query = "key terms definitions concepts important facts principles"
        results = query_vectorstore(note_id, search_query, n_results=15)
        
        if not results or not results.get("documents") or not results["documents"][0]:
            return []
        
        # Combine context
        documents = results["documents"][0]
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        
        context_parts = []
        for doc, metadata in zip(documents[:8], metadatas[:8]):  # Use top 8 chunks
            page = metadata.get("page", "Unknown")
            context_parts.append(f"[Page {page}]: {doc}")
        
        full_context = "\n\n".join(context_parts)
        
        # Create prompt
        card_types = []
        if include_definitions:
            card_types.append("key terms with their definitions")
        if include_concepts:
            card_types.append("important concepts with explanations")
        
        types_str = " and ".join(card_types) if card_types else "key information"
        
        prompt = f"""Generate exactly {num_cards} flashcards covering {types_str}.

Requirements:
- Front: Concise term, concept, or question (max 15 words)
- Back: Clear definition or explanation (2-3 sentences)
- Include page reference from the context
- Rate difficulty as "easy", "medium", or "hard"
- Focus on the most important and testable information
- Make cards suitable for active recall practice"""

        # Get response from Ollama
        response = get_ollama_response_for_flashcards(prompt, full_context)
        
        if not response:
            return generate_fallback_flashcards(documents, metadatas, num_cards)
        
        # Parse JSON response
        try:
            flashcard_data = json.loads(response)
            cards = flashcard_data.get("cards", [])
            
            # Validate and clean flashcards
            valid_cards = []
            for card in cards[:num_cards]:
                if "front" in card and "back" in card:
                    # Ensure difficulty is valid
                    if "difficulty" not in card or card["difficulty"] not in ["easy", "medium", "hard"]:
                        card["difficulty"] = "medium"
                    
                    # Ensure page reference exists
                    if "page_reference" not in card:
                        card["page_reference"] = "N/A"
                    
                    valid_cards.append(card)
            
            return valid_cards
        
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {str(e)}")
            print(f"Response was: {response[:200]}...")
            return generate_fallback_flashcards(documents, metadatas, num_cards)
    
    except Exception as e:
        print(f"Error generating flashcards: {str(e)}")
        return []


def generate_fallback_flashcards(documents: List[str], metadatas: List[Dict], num_cards: int) -> List[Dict[str, Any]]:
    """
    Generate simple fallback flashcards if AI generation fails
    """
    cards = []
    
    for i, (doc, metadata) in enumerate(zip(documents[:num_cards], metadatas[:num_cards])):
        page = metadata.get("page", "Unknown")
        
        # Split into sentences
        sentences = [s.strip() for s in doc.split(". ") if len(s.strip()) > 20]
        
        if sentences:
            # Use first sentence as the concept, rest as explanation
            front = sentences[0] if len(sentences[0]) < 100 else sentences[0][:97] + "..."
            back = ". ".join(sentences[1:3]) if len(sentences) > 1 else sentences[0]
            
            card = {
                "front": f"What is discussed on page {page}?",
                "back": front + (". " + back if back != sentences[0] else ""),
                "page_reference": str(page),
                "difficulty": "medium"
            }
            cards.append(card)
    
    return cards


def calculate_flashcard_stats(card_reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate statistics for flashcard practice
    """
    if not card_reviews:
        return {
            "total_cards": 0,
            "reviewed": 0,
            "mastered": 0,
            "needs_review": 0,
            "average_confidence": 0.0
        }
    
    total = len(card_reviews)
    reviewed = sum(1 for r in card_reviews if r.get("confidence", 0) > 0)
    mastered = sum(1 for r in card_reviews if r.get("confidence", 0) >= 4)
    needs_review = sum(1 for r in card_reviews if 0 < r.get("confidence", 0) < 3)
    
    confidences = [r.get("confidence", 0) for r in card_reviews if r.get("confidence", 0) > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    
    return {
        "total_cards": total,
        "reviewed": reviewed,
        "mastered": mastered,
        "needs_review": needs_review,
        "average_confidence": round(avg_confidence, 2)
    }
