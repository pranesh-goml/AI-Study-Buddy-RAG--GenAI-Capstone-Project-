import os
import json
import requests
from typing import List, Dict, Any
from utils.chroma_setup import query_vectorstore

def get_ollama_response_for_quiz(prompt: str, context: str, model: str = "phi3:latest") -> str:
    """
    Get quiz questions from Ollama
    """
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    api_url = f"{ollama_url}/api/generate"
    
    full_prompt = f"""You are a quiz generator. Create multiple-choice questions based on the provided context.

Context from study materials:
{context}

{prompt}

IMPORTANT: Respond ONLY with valid JSON. No other text before or after. Format:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": [
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
      ],
      "explanation": "Explanation of correct answer",
      "page_reference": "Page X"
    }}
  ]
}}"""

    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.7,
            "num_predict": 2000
        }
    }
    
    try:
        print(f"🎯 Generating quiz with Ollama {model}...")
        response = requests.post(api_url, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get("response", "").strip()
            if answer:
                print(f"✅ Quiz generated successfully!")
                return answer
        else:
            print(f"❌ Ollama error: {response.status_code}")
            return None
    
    except Exception as e:
        print(f"❌ Quiz generation error: {str(e)}")
        return None


def generate_quiz_questions(note_id: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict[str, Any]]:
    """
    Generate quiz questions from a note
    """
    try:
        # Get relevant content from the note
        results = query_vectorstore(note_id, "main concepts key topics important information", n_results=10)
        
        if not results or not results.get("documents") or not results["documents"][0]:
            return []
        
        # Combine context
        documents = results["documents"][0]
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        
        context_parts = []
        for doc, metadata in zip(documents[:5], metadatas[:5]):  # Use top 5 chunks
            page = metadata.get("page", "Unknown")
            context_parts.append(f"[Page {page}]: {doc}")
        
        full_context = "\n\n".join(context_parts)
        
        # Create prompt based on difficulty
        difficulty_prompts = {
            "easy": "Create easy multiple-choice questions testing basic recall and understanding.",
            "medium": "Create medium difficulty questions testing comprehension and application.",
            "hard": "Create challenging questions testing analysis, synthesis, and evaluation."
        }
        
        prompt = f"""Generate exactly {num_questions} multiple-choice questions.
Difficulty level: {difficulty}
{difficulty_prompts.get(difficulty, difficulty_prompts["medium"])}

Each question must have:
- Clear question text
- 4 options (A, B, C, D)
- Exactly ONE correct answer
- Brief explanation of why the answer is correct
- Page reference from the context"""

        # Get response from Ollama
        response = get_ollama_response_for_quiz(prompt, full_context)
        
        if not response:
            return generate_fallback_questions(documents, metadatas, num_questions)
        
        # Parse JSON response
        try:
            quiz_data = json.loads(response)
            questions = quiz_data.get("questions", [])
            
            # Validate and clean questions
            valid_questions = []
            for q in questions[:num_questions]:
                if "question" in q and "options" in q and len(q["options"]) == 4:
                    # Ensure at least one correct answer
                    has_correct = any(opt.get("is_correct", False) for opt in q["options"])
                    if has_correct:
                        valid_questions.append(q)
            
            return valid_questions
        
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {str(e)}")
            print(f"Response was: {response[:200]}...")
            return generate_fallback_questions(documents, metadatas, num_questions)
    
    except Exception as e:
        print(f"Error generating quiz: {str(e)}")
        return []


def generate_fallback_questions(documents: List[str], metadatas: List[Dict], num_questions: int) -> List[Dict[str, Any]]:
    """
    Generate simple fallback questions if AI generation fails
    """
    questions = []
    
    for i, (doc, metadata) in enumerate(zip(documents[:num_questions], metadatas[:num_questions])):
        page = metadata.get("page", "Unknown")
        
        # Create a simple comprehension question
        sentences = doc.split(". ")
        if len(sentences) >= 2:
            question = {
                "question": f"Based on the content from page {page}, which statement is correct?",
                "options": [
                    {"text": sentences[0] + ".", "is_correct": True},
                    {"text": "This information is not mentioned in the document.", "is_correct": False},
                    {"text": "The opposite of what is stated is true.", "is_correct": False},
                    {"text": "None of the above information is accurate.", "is_correct": False}
                ],
                "explanation": f"The correct answer is directly stated in the source material on page {page}.",
                "page_reference": str(page)
            }
            questions.append(question)
    
    return questions


def validate_quiz_answers(questions: List[Dict[str, Any]], user_answers: List[int]) -> Dict[str, Any]:
    """
    Validate user's quiz answers and calculate score
    """
    if len(user_answers) != len(questions):
        raise ValueError("Number of answers doesn't match number of questions")
    
    correct_count = 0
    results = []
    
    for i, (question, user_answer) in enumerate(zip(questions, user_answers)):
        options = question["options"]
        correct_index = next((j for j, opt in enumerate(options) if opt["is_correct"]), 0)
        
        is_correct = user_answer == correct_index
        if is_correct:
            correct_count += 1
        
        results.append({
            "question_number": i + 1,
            "question": question["question"],
            "user_answer": options[user_answer]["text"] if 0 <= user_answer < len(options) else "No answer",
            "correct_answer": options[correct_index]["text"],
            "is_correct": is_correct,
            "explanation": question.get("explanation", ""),
            "page_reference": question.get("page_reference", "")
        })
    
    total = len(questions)
    percentage = (correct_count / total * 100) if total > 0 else 0
    
    return {
        "score": correct_count,
        "total": total,
        "percentage": round(percentage, 2),
        "results": results
    }
