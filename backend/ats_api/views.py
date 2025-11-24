import os
import base64
import io
import json
import logging
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFPageCountError
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from huggingface_hub import login
from sentence_transformers import SentenceTransformer, util
from django.db import transaction

from rest_framework.pagination import PageNumberPagination

from .models import Candidat, CV, JobOffer, Evaluation
from django.db.models import Q

logger = logging.getLogger(__name__)

# CONFIG
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set")
else:
    genai.configure(api_key=GEMINI_API_KEY)

if HF_TOKEN:
    login(token=HF_TOKEN)
else:
    logger.warning("HF_TOKEN not set")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_PDF_PAGES = 3
ALLOWED_MIME_TYPES = ["application/pdf"]
MODEL_NAME = "vahoaka/sentence-transformers-model-vahoaka-v1"

# Lazy load the model
_similarity_model = None

def get_similarity_model():
    global _similarity_model
    if _similarity_model is None:
        _similarity_model = SentenceTransformer(MODEL_NAME)
    return _similarity_model


# HELPERS

def normalize_similarity(score: float) -> float:
    """Convert cosine similarity (-1..1) to percentage (0..100)"""

    return round(max(0, min(100, (score + 1) / 2 * 100)), 2)


def semantic_similarity(text_a: str, text_b: str) -> float:

    if not text_a or not text_b:
        return 0.0

    model = get_similarity_model()
    emb = model.encode([text_a, text_b], convert_to_tensor=True)
    score = util.cos_sim(emb[0], emb[1]).item()

    return normalize_similarity(score)


def extract_json(raw: str) -> dict:
    """Extract and repair JSON from Gemini output (very tolerant)."""

    text = raw.strip()

    # Remove markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    # Remove separators like '---', '===='
    text = re.sub(r"-{3,}", "", text)

    # Extract the first JSON-like block
    match = re.search(r"\{.*", text, flags=re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in response")

    json_str = match.group(0)

    # Keep only up to the LAST closing brace "}"
    last_brace = json_str.rfind("}")
    if last_brace != -1:
        json_str = json_str[:last_brace + 1]

    # Fix trailing commas before } or ]
    json_str = re.sub(r",\s*([\]}])", r"\1", json_str)

    # Replace fancy quotes
    json_str = json_str.replace("“", "\"").replace("”", "\"")

    # Remove invisible characters
    json_str = json_str.replace("\u200b", "")

    # Try to parse final JSON
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Still invalid JSON after repair: {e}\n---\n{json_str}\n---"
        )




def validate_pdf(pdf_file) -> tuple[bool, Optional[str]]:
    """Validate PDF file before processing"""

    if pdf_file.size > MAX_FILE_SIZE:
        return False, f"File '{pdf_file.name}' exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit"
    
    content_type = getattr(pdf_file, 'content_type', '')
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        return False, f"File '{pdf_file.name}' is not a valid PDF"
    
    return True, None


def pdf_to_base64_image(pdf_bytes: bytes, page_num: int = 0) -> str:
    """Convert single PDF page to base64-encoded PNG image with memory management"""

    try:
        images = convert_from_bytes(
            pdf_bytes,
            dpi=200,
            fmt="png",
            first_page=page_num + 1,
            last_page=page_num + 1
        )
        
        if not images:
            raise ValueError("No pages found in PDF")
        
        img = images[0]
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        
        # Clean up
        buf.close()
        del images
        
        return b64
        
    except PDFPageCountError:
        raise ValueError("Could not read PDF - file may be corrupted")
    except Exception as e:
        raise ValueError(f"PDF conversion failed: {str(e)}")


# PROMPTS

def gemini_extract_job_prompt(job_description: str) -> str:
    return f"""Tu es un expert en ressources humaines.

Analyse cette description de poste:

{job_description}

OBJECTIF: Extraire le titre du poste et les compétences requises.

RÉPONDS UNIQUEMENT avec ce JSON (sans markdown, sans explication):

{{
  "job_title": "",
  "job_competences": ["Python", "Git", "..."]
}}

NOTES:
- job_title: titre exact du poste
- job_competences: liste des compétences i.g: Python, Git, JavaScript
- Répondre UNIQUEMENT en format JSON valide
- Si un champ est introuvable → renvoyer "" au lieu d’inventer
- Ne pas déduire, uniquement extraire
"""


def gemini_extract_cv_prompt() -> str:
    return """Tu es un expert en ressources humaines.

Analyse ce CV et extrais les informations structurées.

RÉPONDS UNIQUEMENT avec ce JSON (sans markdown, sans explication):

{
  "identite": {
    "nom": "",
    "email": "",
    "telephone": "",
    "adresse": ""
  },
  "job_title": "",
  "competences": [],
  "resume_experience": "",
}

NOTES:
- nom: le nom complet si possible
- Ne pas inclure ``` ou ### ou --
- job_title: titre de poste actuel ou recherché
- competences: toutes compétences techniques
- resume_experience: résumé concis (2-3 phrases) de l'expérience
- Répondre UNIQUEMENT en format JSON valide
- Si un champ est introuvable → renvoyer "" au lieu d’inventer
- Ne pas déduire, uniquement extraire
"""


# GEMINI PIPELINE

def create_gemini_model():
    """Create configured Gemini model instance"""

    return genai.GenerativeModel(
        "gemini-2.5-flash",
        generation_config={
            "temperature": 0.0,
            "top_p": 0.95,
            "max_output_tokens": 2048,
        },
        safety_settings={
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    )


def gemini_extract_job(job_description: str) -> dict:
    """Extract job title and competences from job description"""

    prompt = gemini_extract_job_prompt(job_description)
    model = create_gemini_model()
    
    try:
        response = model.generate_content([{"text": prompt}])
        
        if not response.text:
            raise ValueError("Empty response from Gemini")
        
        return extract_json(response.text)
    
    except Exception as e:
        logger.exception("Gemini job extraction failed")
        raise ValueError(f"Job extraction failed: {str(e)}")


def gemini_extract_cv(pdf_bytes: bytes) -> dict:
    """Extract CV data using Gemini vision"""

    b64_image = pdf_to_base64_image(pdf_bytes, page_num=0)
    
    prompt = gemini_extract_cv_prompt()
    model = create_gemini_model()
    
    content = [
        {"text": prompt},
        {"inline_data": {"mime_type": "image/png", "data": b64_image}}
    ]
    
    try:
        response = model.generate_content(content)
        
        if not response.text:
            raise ValueError("Empty response from Gemini")
        
        return extract_json(response.text)
    
    except Exception as e:
        logger.exception("Gemini CV extraction failed")
        raise ValueError(f"CV extraction failed: {str(e)}")
    finally:
        # Clean up base64 string from memory
        del b64_image


def get_or_create_candidat(cv_data: dict) -> Candidat:
    """Get existing candidat or create new one based on email"""

    identite = cv_data.get("identite", {})
    email = identite.get("email", "").strip()
    
    if not email:
        raise ValueError("Email is required to create or retrieve candidate")
    
    # Check if candidat exists
    candidat, created = Candidat.objects.get_or_create(
        email=email,
        defaults={
            "nom": identite.get("nom", ""),
            "prenom": identite.get("prenom", ""),
            "telephone": identite.get("telephone", ""),
            "localisation": identite.get("adresse", "")
        }
    )
    
    # Update existing candidat if found
    if not created:
        candidat.nom = identite.get("nom", candidat.nom)
        candidat.prenom = identite.get("prenom", candidat.prenom)
        candidat.telephone = identite.get("telephone", candidat.telephone)
        candidat.localisation = identite.get("adresse", candidat.localisation)
        candidat.save()
    
    return candidat


def save_cv_to_db(cv_data: dict, pdf_file, candidat: Candidat) -> CV:
    """Save CV to database, avoiding duplicates based on content hash"""

    competences_str = ", ".join(cv_data.get("competences", []))
    experience_str = cv_data.get("resume_experience", "")
    
    # Check for duplicate CV based on candidat and similar content
    existing_cv = CV.objects.filter(
        candidat=candidat,
        competences=competences_str,
        experience=experience_str
    ).first()
    
    if existing_cv:
        logger.info(f"Duplicate CV found for {candidat.email}, reusing existing")
        return existing_cv
    
    # Create new CV
    cv = CV.objects.create(
        candidat=candidat,
        experience=experience_str,
        competences=competences_str,
        source_pdf=pdf_file,
        texte_brut=json.dumps(cv_data, ensure_ascii=False)
    )
    
    return cv


# API ENDPOINTS

@api_view(["POST"])
def evaluate_cv_vs_offer(request):
    """
    Evaluate multiple CVs against a job offer and save to database.
    
    Request:
        - resumes: PDF files (multipart/form-data)
        - job_description: string
    
    Response:
        {
            "success": true,
            "job_id": 1,
            "count": 5,
            "top_ranked": [...]
        }
    """
    try:
        # Validation
        if "resumes" not in request.FILES:
            return Response({
                "success": False,
                "error": "No CV files provided"
            }, status=400)
        
        job_description = request.data.get("job_description", "").strip()
        if not job_description:
            return Response({
                "success": False,
                "error": "Job description is required"
            }, status=400)
        
        pdfs = request.FILES.getlist("resumes")
        if len(pdfs) > 20:
            return Response({
                "success": False,
                "error": "Maximum 20 CVs allowed per request"
            }, status=400)
        
        # Extract job information
        try:
            job_data = gemini_extract_job(job_description)
        except Exception as e:
            logger.exception("Failed to extract job data")
            return Response({
                "success": False,
                "error": f"Failed to analyze job description: {str(e)}"
            }, status=500)
        
        # Create JobOffer in database
        with transaction.atomic():
            job_offer = JobOffer.objects.create(
                title=job_data.get("job_title", ""),
                description=job_description,
                competences_requises=", ".join(job_data.get("job_competences", []))
            )
        
        # Process CVs
        results = []
        errors = []
        
        for pdf in pdfs:
            valid, error_msg = validate_pdf(pdf)
            if not valid:
                errors.append({"file": pdf.name, "error": error_msg})
                continue
            
            try:
                # Read PDF bytes
                pdf_bytes = pdf.read()
                
                # Extract CV data
                cv_data = gemini_extract_cv(pdf_bytes)
                
                # Save to database (with duplicate check)
                with transaction.atomic():
                    candidat = get_or_create_candidat(cv_data)
                    cv_obj = save_cv_to_db(cv_data, pdf, candidat)
                
                # Calculate similarity score
                cv_text = cv_data.get("resume_experience", "") + " " + " ".join(cv_data.get("competences", []))
                job_text = job_description + " " + " ".join(job_data.get("job_competences", []))
                score = semantic_similarity(cv_text, job_text)
                
                # Save evaluation
                with transaction.atomic():
                    evaluation = Evaluation.objects.create(
                        cv=cv_obj,
                        job_offer=job_offer,
                        score=score,
                        explanation=f"Match automatique basé sur similarité sémantique"
                    )
                
                results.append({
                    "candidat_id": candidat.id,
                    "cv_id": cv_obj.id,
                    "evaluation_id": evaluation.id,
                    "filename": pdf.name,
                    "nom": cv_data['identite'].get('nom', '').strip(),
                    "email": cv_data["identite"].get("email", ""),
                    "telephone": cv_data["identite"].get("telephone", '').strip(),
                    "job_title": cv_data.get("job_title", ""),
                    "score_sur_100": score,
                    "competences": cv_data.get("competences", []),
                    "resume_experience": cv_data.get("resume_experience", "")
                })
                
                # Clean up to free memory
                del pdf_bytes
                del cv_data
            
            except ValueError as e:
                errors.append({"file": pdf.name, "error": str(e)})
            except Exception as e:
                logger.exception(f"Failed to process {pdf.name}")
                errors.append({"file": pdf.name, "error": f"Processing error: {str(e)}"})
        
        if not results:
            return Response({
                "success": False,
                "error": "No CVs could be processed",
                "details": errors
            }, status=422)
        
        # Sort by score
        ranked = sorted(results, key=lambda x: x["score_sur_100"], reverse=True)
        
        return Response({
            "success": True,
            "job_id": job_offer.id,
            "job_title": job_offer.title,
            "job_description": job_description,
            "job_competences": job_data.get("job_competences"),
            "top_ranked": ranked,
            "errors": errors if errors else None
        })
    
    except Exception as e:
        logger.exception("Unexpected error in evaluate_cv_vs_offer")
        return Response({
            "success": False,
            "error": "Internal server error",
            "details": str(e)
        }, status=500)


@api_view(["GET"])
def health_check(request):
    """Check API health and dependencies"""
    checks = {
        "api": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "huggingface_configured": bool(HF_TOKEN),
        "similarity_model": None
    }
    
    try:
        get_similarity_model()
        checks["similarity_model"] = "loaded"
    except Exception as e:
        checks["similarity_model"] = f"error: {str(e)}"
    
    all_healthy = all([
        checks["gemini_configured"],
        checks["similarity_model"] == "loaded"
    ])
    
    return Response({
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks
    }, status=200 if all_healthy else 503)


class CandidatPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50

@api_view(["GET"])
def list_candidats(request):

    try:
        search = request.GET.get("search", "").strip()

        qs = Candidat.objects.all().order_by("nom")

        # SEARCH MODE -> return everything
        if search:
            qs = qs.filter(
                Q(nom__icontains=search) |
                Q(email__icontains=search) |
                Q(cv__competences__icontains=search) 
            ).distinct()

            results = [{
                "id": c.id,
                "nom": c.nom,
                "email": c.email,
                "telephone": c.telephone,
                "localisation": c.localisation,
            } for c in qs]

            return Response({
                "success": True,
                "count": len(results),
                "candidats": results,
                "paginated": False
            })


        # NO SEARCH -> paginated
        paginator = CandidatPagination()
        page = paginator.paginate_queryset(qs, request)

        results = []

        for c in page:
            results.append({
                "id": c.id,
                "nom": c.nom,
                "email": c.email,
                "telephone": c.telephone,
                "localisation": c.localisation,
            })

        return paginator.get_paginated_response({
            "success": True,
            "candidats": results,
            "paginated": True
        })

    except Exception as e:
        logger.exception("List candidats failed")
        return Response({"error": str(e)}, status=500)
