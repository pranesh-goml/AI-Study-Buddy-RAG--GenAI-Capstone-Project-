import pdfplumber
from typing import List, Dict

def extract_text_from_pdf(file_path: str) -> List[Dict[str, any]]:
    """
    Extract text from PDF file with page numbers.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        List of dicts with page number and text content
    """
    pages_content = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text:
                    pages_content.append({
                        "page": page_num,
                        "content": text.strip()
                    })
    except Exception as e:
        raise Exception(f"Error parsing PDF: {str(e)}")
    
    return pages_content

def extract_text_from_txt(file_path: str) -> List[Dict[str, any]]:
    """
    Extract text from plain text file.
    
    Args:
        file_path: Path to the text file
        
    Returns:
        List with single dict containing all text
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return [{"page": 1, "content": content.strip()}]
    except Exception as e:
        raise Exception(f"Error reading text file: {str(e)}")
