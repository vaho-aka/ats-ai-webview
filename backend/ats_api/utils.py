# utils.py
"""
Utility functions for the ATS Resume Checker application.
Includes validators, helpers, and custom exceptions.
"""

import re
import mimetypes
from typing import Optional, Dict, Any
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile


class ResumeValidationError(Exception):
    """Custom exception for resume validation errors."""
    pass


class GeminiAPIError(Exception):
    """Custom exception for Gemini API errors."""
    pass


def validate_file_size(file: UploadedFile, max_size_mb: int = 10) -> None:
    """
    Validate that uploaded file doesn't exceed size limit.
    
    Args:
        file: Uploaded file object
        max_size_mb: Maximum file size in megabytes
    
    Raises:
        ResumeValidationError: If file exceeds size limit
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    if file.size > max_size_bytes:
        raise ResumeValidationError(
            f"File size ({file.size / (1024*1024):.2f} MB) exceeds "
            f"maximum allowed size of {max_size_mb} MB"
        )


def validate_pdf_format(file: UploadedFile) -> None:
    """
    Validate that the uploaded file is a valid PDF.
    
    Args:
        file: Uploaded file object
    
    Raises:
        ResumeValidationError: If file is not a valid PDF
    """
    # Check file extension
    if not file.name.lower().endswith('.pdf'):
        raise ResumeValidationError("File must have .pdf extension")
    
    # Check MIME type
    mime_type, _ = mimetypes.guess_type(file.name)
    if mime_type != 'application/pdf':
        raise ResumeValidationError(f"Invalid MIME type: {mime_type}. Expected application/pdf")
    
    # Check PDF magic number
    file.seek(0)
    header = file.read(4)
    file.seek(0)
    
    if not header.startswith(b'%PDF'):
        raise ResumeValidationError("File does not appear to be a valid PDF (invalid header)")


def validate_job_description(job_desc: str, min_length: int = 10, max_length: int = 10000) -> None:
    """
    Validate job description text.
    
    Args:
        job_desc: Job description text
        min_length: Minimum character length
        max_length: Maximum character length
    
    Raises:
        ResumeValidationError: If job description is invalid
    """
    if not job_desc or not job_desc.strip():
        raise ResumeValidationError("Job description cannot be empty")
    
    job_desc = job_desc.strip()
    
    if len(job_desc) < min_length:
        raise ResumeValidationError(
            f"Job description too short (minimum {min_length} characters)"
        )
    
    if len(job_desc) > max_length:
        raise ResumeValidationError(
            f"Job description too long (maximum {max_length} characters)"
        )


def sanitize_text(text: str) -> str:
    """
    Sanitize text by removing potentially harmful characters.
    
    Args:
        text: Input text
    
    Returns:
        Sanitized text
    """
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Remove control characters except newline, tab, and carriage return
    text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', text)
    
    return text.strip()


def extract_email(text: str) -> Optional[str]:
    """
    Extract email address from text.
    
    Args:
        text: Text to search
    
    Returns:
        Email address if found, None otherwise
    """
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """
    Extract phone number from text.
    Supports various international formats.
    
    Args:
        text: Text to search
    
    Returns:
        Phone number if found, None otherwise
    """
    # Pattern for international phone numbers
    phone_patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    
    return None


def calculate_keyword_match_score(resume_text: str, job_keywords: list) -> float:
    """
    Calculate how many job keywords appear in resume.
    
    Args:
        resume_text: Text extracted from resume
        job_keywords: List of keywords from job description
    
    Returns:
        Match score as percentage (0-100)
    """
    if not job_keywords:
        return 0.0
    
    resume_lower = resume_text.lower()
    matched = sum(1 for keyword in job_keywords if keyword.lower() in resume_lower)
    
    return (matched / len(job_keywords)) * 100


def format_gemini_response(raw_response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format and validate Gemini API response.
    Ensures all expected fields are present with default values if missing.
    
    Args:
        raw_response: Raw response from Gemini API
    
    Returns:
        Formatted response with all expected fields
    """
    formatted = {
        'identite': raw_response.get('identite', {
            'nom': '',
            'contact': {
                'email': '',
                'telephone': '',
                'adresse': ''
            }
        }),
        'competences': raw_response.get('competences', []),
        'formations': raw_response.get('formations', []),
        'experiences': raw_response.get('experiences', []),
        'phrases_resume': raw_response.get('phrases_resume', []),
        'texte_source_analyse_gemini': raw_response.get('texte_source_analyse_gemini', ''),
        'comparaison_avec_offre': raw_response.get('comparaison_avec_offre', {
            'score_sur_100': 0,
            'explication': '',
            'points_forts': [],
            'points_amelioration': [],
            'mots_cles_manquants': []
        })
    }
    
    # Validate score is within 0-100
    score = formatted['comparaison_avec_offre'].get('score_sur_100', 0)
    if not isinstance(score, (int, float)) or score < 0 or score > 100:
        formatted['comparaison_avec_offre']['score_sur_100'] = 0
    
    return formatted


def truncate_base64_for_logging(base64_str: str, max_length: int = 100) -> str:
    """
    Truncate base64 string for logging purposes.
    
    Args:
        base64_str: Base64 encoded string
        max_length: Maximum length to keep
    
    Returns:
        Truncated string with indicator
    """
    if len(base64_str) <= max_length:
        return base64_str
    
    return f"{base64_str[:max_length]}... (truncated, total length: {len(base64_str)})"


def estimate_processing_time(num_pages: int) -> int:
    """
    Estimate processing time based on number of PDF pages.
    
    Args:
        num_pages: Number of pages in PDF
    
    Returns:
        Estimated time in seconds
    """
    # Base time: 5 seconds
    # Additional time per page: 3 seconds
    # Gemini API call: 10-20 seconds
    base_time = 5
    per_page_time = 3
    api_time = 15
    
    return base_time + (num_pages * per_page_time) + api_time


def create_error_response(error: Exception, include_trace: bool = False) -> Dict[str, Any]:
    """
    Create standardized error response.
    
    Args:
        error: Exception object
        include_trace: Whether to include stack trace (for debugging)
    
    Returns:
        Error response dictionary
    """
    response = {
        'success': False,
        'error': str(error),
        'error_type': type(error).__name__
    }
    
    if include_trace:
        import traceback
        response['trace'] = traceback.format_exc()
    
    return response


def validate_gemini_json_structure(data: Dict[str, Any]) -> bool:
    """
    Validate that Gemini response has the expected JSON structure.
    
    Args:
        data: Parsed JSON data from Gemini
    
    Returns:
        True if valid, False otherwise
    """
    required_keys = ['identite', 'competences', 'comparaison_avec_offre']
    
    # Check if all required keys are present
    if not all(key in data for key in required_keys):
        return False
    
    # Check identite structure
    if 'nom' not in data.get('identite', {}):
        return False
    
    # Check comparaison_avec_offre structure
    comparison = data.get('comparaison_avec_offre', {})
    if 'score_sur_100' not in comparison:
        return False
    
    return True


def clean_gemini_response(text: str) -> str:
    """
    Clean Gemini response text to extract pure JSON.
    Removes markdown code blocks, extra whitespace, etc.
    
    Args:
        text: Raw text response from Gemini
    
    Returns:
        Cleaned text
    """
    # Remove markdown code blocks
    text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    
    # Remove any leading/trailing whitespace
    text = text.strip()
    
    # Remove any BOM (Byte Order Mark)
    text = text.lstrip('\ufeff')
    
    return text


def get_file_info(file: UploadedFile) -> Dict[str, Any]:
    """
    Get detailed information about uploaded file.
    
    Args:
        file: Uploaded file object
    
    Returns:
        Dictionary with file information
    """
    return {
        'name': file.name,
        'size': file.size,
        'size_mb': round(file.size / (1024 * 1024), 2),
        'content_type': file.content_type,
        'charset': file.charset,
    }