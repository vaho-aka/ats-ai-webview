import os
import base64
import io
import json
import logging
import requests
import re
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from pdf2image import convert_from_bytes

from .models import Candidat, CV, Competence, CvCompetence, Experience, JobOffer, EvaluationPair

logger = logging.getLogger(__name__)

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# HELPER FUNCTIONS

def build_gemini_prompt(job_description: str) -> str:
    """Create the prompt that tells Gemini how to analyze the CV"""
    return f"""
Analysez ce CV et la description du poste ci-dessous.

DESCRIPTION DE POSTE:
{job_description}

Réponds UNIQUEMENT en JSON (aucun markdown, aucun backtick). Utilise exactement ce format :

{{
  "identite": {{
    "nom": "First Last",
    "contact": {{
      "email": "email@example.com",
      "telephone": "+261340650489",
      "adresse": "Address"
    }}
  }},
  "competences": ["list", "des", "competences", "trouvees", "dans", "le", "cv"],
  "resume_experience": "Summary of work experience in a few sentences",
  "job_competences": ["list", "des", "competences", "dans", "la", "description", "du", "poste"],
  "texte_source_analyse_gemini": "Extracted text from CV",
}}

Extrait tout le texte des images du CV et remplis tous les champs. Retourne uniquement le JSON.
"""


def call_gemini_api(prompt: str, images_payload: list) -> dict:
    """Send images and prompt to Gemini API and get JSON response"""
    if not GEMINI_API_KEY:
        raise EnvironmentError("GEMINI_API_KEY not configured")

    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

    # Prepare images for Gemini
    image_parts = []
    for img_data in images_payload:
        base64_str = img_data["image_base64"]
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        
        image_parts.append({
            "inline_data": {
                "mime_type": "image/png",
                "data": base64_str
            }
        })

    # API request body
    body = {
        "contents": [{
            "parts": [
                {"text": prompt},
                *image_parts
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 4096,
        }
    }

    # Call API
    resp = requests.post(url, headers={"Content-Type": "application/json"}, json=body, timeout=120)
    
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini API error: {resp.status_code}")

    data = resp.json()
    
    # Extract text from response
    text_content = data["candidates"][0]["content"]["parts"][0]["text"]
    
    # Clean markdown formatting if present
    text_content = text_content.strip()
    text_content = re.sub(r'^```json\s*', '', text_content)
    text_content = re.sub(r'\s*```$', '', text_content)
    
    # Parse JSON
    return json.loads(text_content)


def save_to_database(gemini_result: dict, job_des, pdf_file) -> dict:
    """Save all extracted data to database and return IDs"""
    
    # 1. Create or get candidate
    ident = gemini_result.get("identite", {})
    contact = ident.get("contact", {})
    email = contact.get("email", f"temp_{os.urandom(4).hex()}@example.com")
    
    nom_parts = ident.get("nom", "Unknown").split(maxsplit=1)
    prenom = nom_parts[0] if nom_parts else ""
    nom = nom_parts[1] if len(nom_parts) > 1 else nom_parts[0]
    
    candidat, _ = Candidat.objects.get_or_create(
        email=email,
        defaults={
            "nom": nom,
            "prenom": prenom,
            "telephone": contact.get("telephone", ""),
            "localisation": contact.get("adresse", "")
        }
    )
    
    # 2. Create CV
    cv = CV.objects.create(
        candidat=candidat,
        texte_brut=gemini_result.get("texte_source_analyse_gemini", ""),
        experience=gemini_result.get("resume_experience", ""),
        competences="".join(gemini_result.get("competences", [])),
        source_pdf=pdf_file
    )

    # 3. Create job_description (not linked to CV)
    job_desc = job_des
    job_comp = "".join(gemini_result.get("job_competences", []))

    job_description = JobOffer.objects.create(
        description=job_desc,
        competences_requises=job_comp
    )
    
    return {
        "candidat": candidat,
        "CV": cv,
        "job_description": job_description
    }


# API ENDPOINTS
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_and_analyze_cv(request):
    """
    Main endpoint: Upload PDF, analyze with AI, save to database
    
    Required:
    - resume: PDF file
    - job_description: Job description text
    
    Returns: resume_text, skills, experience summary, candidat and CV IDs
    """
    try:
        # Validate inputs
        if "resume" not in request.FILES:
            return Response({"error": "Resume file required"}, status=400)
        
        if "job_description" not in request.data:
            return Response({"error": "Job description required"}, status=400)

        resume_file = request.FILES["resume"]
        job_description = request.data["job_description"].strip()

        # Validate PDF
        if not resume_file.name.lower().endswith(".pdf"):
            return Response({"error": "Only PDF files supported"}, status=400)
        
        if resume_file.size > MAX_FILE_SIZE:
            return Response({"error": "File too large (max 10MB)"}, status=400)

        # Convert PDF to images
        pdf_bytes = resume_file.read()
        
        if not pdf_bytes.startswith(b'%PDF'):
            return Response({"error": "Invalid PDF file"}, status=400)
        
        images = convert_from_bytes(pdf_bytes, dpi=200, fmt="png")
        
        if not images:
            return Response({"error": "PDF is empty"}, status=400)

        # Encode images to base64
        images_payload = []
        for i, img in enumerate(images):
            buffer = io.BytesIO()
            img.save(buffer, format="PNG", optimize=True)
            b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            
            images_payload.append({
                "page_number": i + 1,
                "image_base64": f"data:image/png;base64,{b64}"
            })

        # Call Gemini AI
        prompt = build_gemini_prompt(job_description)
        gemini_result = call_gemini_api(prompt, images_payload)

        # Save to database
        resume_file.seek(0)  # Reset file pointer
        db_result = save_to_database(gemini_result, resume_file)

        # Return success
        return Response({
            "success": True,
            "message": "CV analyzed and saved successfully",
            "filename": resume_file.name,
            "total_pages": len(images_payload),
            "cv_id": db_result["cv_id"],
            "candidat_id": db_result["candidat_id"],
            "candidat_email": db_result["candidat_email"],
            "analysis": gemini_result
        })

    except Exception as e:
        logger.exception("Error processing CV")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def evaluate_cv_vs_offer(request):
    """
    Compare existing CV with job offer
    
    Required:
    - cv_id: CV ID
    - offer_id: Job offer ID
    
    Returns: Compatibility score
    """
    try:
        cv_id = request.data.get("cv_id")
        offer_id = request.data.get("offer_id")

        if not cv_id or not offer_id:
            return Response({"error": "cv_id and offer_id required"}, status=400)

        cv = get_object_or_404(CV, pk=cv_id)
        offer = get_object_or_404(JobOffer, pk=offer_id)

        # Build evaluation prompt
        prompt = f"""
Compare this CV with the job offer and return a JSON score.

CV: {cv.resume_ai[:500]}
Skills: {', '.join([c.competence.nom_comp for c in cv.cv_competences.all()])}

Job Offer: {offer.titre}
Description: {offer.description[:500]}
Required: {offer.competences_requises}

Return only this JSON:
{{
  "score_sur_100": 85,
  "explication": "Brief explanation",
  "recommandations": ["Tip 1", "Tip 2"]
}}
"""

        # Call Gemini
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024}
        }
        
        resp = requests.post(url, json=body, timeout=60)
        
        if resp.status_code == 200:
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r'^```json\s*|\s*```$', '', text.strip())
            result = json.loads(text)
            
            score = result.get("score_sur_100", 0)
            explanation = result.get("explication", "")
        else:
            score = 0
            explanation = "AI evaluation failed"

        # Save evaluation
        pair = EvaluationPair.objects.create(
            cv=cv,
            offre=offer,
            score_genai=score,
            commentaire=explanation
        )

        return Response({
            "success": True,
            "pair_id": pair.pk,
            "score": score,
            "explanation": explanation
        })

    except Exception as e:
        logger.exception("Evaluation failed")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_evaluation_pairs(request):
    """Get all CV-job evaluations"""
    pairs = EvaluationPair.objects.select_related(
        "cv__candidat", "offre"
    ).all().order_by('-date_evaluation')

    data = [{
        "id": p.pk,
        "candidat": str(p.cv.candidat),
        "email": p.cv.candidat.email,
        "job_title": p.offre.titre,
        "score": p.score_genai,
        "date": p.date_evaluation,
    } for p in pairs]

    return Response({"success": True, "evaluations": data, "total": len(data)})


@api_view(["GET"])
def health_check(request):
    """Check if API is working"""
    return Response({
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY)
    })