import os
import base64
import io
import re
import json
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pdf2image import convert_from_bytes
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
from huggingface_hub import login


from .models import Candidat, CV, JobOffer, EvaluationPair

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent.parent
GEMINI_API_KEY = load_dotenv(os.path.join(BASE_DIR, ".env"))

# Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# MODEL 
login(token=os.getenv("HF_TOKEN"))

MODEL_NAME = "vahoaka/sentence-transformers-model-vahoaka-v1"

print("Loading multilingual MiniLM model...")

similarity_model = SentenceTransformer(MODEL_NAME)

def semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Compute cosine similarity (0–100) using the fine-tuned HuggingFace model.
    """
    if not text_a or not text_b:
        return 0.0

    embeddings = similarity_model.encode([text_a, text_b], convert_to_tensor=True)
    score = util.cos_sim(embeddings[0], embeddings[1]).item()

    # Convert -1..1 → 0..100
    normalized = (score + 1) / 2 * 100  
    return round(normalized, 2)


def extract_json(text: str):
    """
    Extract the first valid JSON {...} from Gemini output,
    even if wrapped in markdown or extra text.
    """
    if not text or not isinstance(text, str):
        raise ValueError("Gemini returned empty or invalid output")

    # Remove markdown code fences like ```json
    text = text.replace("```json", "").replace("```", "").strip()

    # Extract the JSON block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"Gemini did not return JSON. Raw output: {text}")

    json_str = match.group(0)

    return json.loads(json_str)

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
  "resume_experience": "Résumé de l'expérience professionnelle en quelques phrases",
  "job_competences": ["list", "des", "competences", "dans", "la", "description", "du", "poste"],
  "job_title": "Intitulé du poste postulé",
}}

Extrait tout le texte des images du CV et remplis tous les champs. Retourne uniquement le JSON.
"""

def gemini_prompt_for_evaluation(resume_data: dict, job_description: str) -> str:
    return f"""
Compare this CV with the job offer and return a JSON score.

CV EXPERIENCE:
{resume_data.get("resume_experience", "")}

CV SKILLS:
{", ".join(resume_data.get("competences", []))}

CV JOB TITLE (if detected):
{resume_data.get("job_title", "")}

JOB REQUIRED SKILLS:
{", ".join(resume_data.get("job_competences", []))}

JOB DESCRIPTION:
{job_description}

Return ONLY JSON with EXACTLY this format:

{{
  "score_sur_100": 0,
  "explication": "short explanation",
  "recommendations": ["conseil 1", "conseil 2"]
}}
"""


def call_gemini_api(prompt: str, images_payload: list):
    model = genai.GenerativeModel("gemini-2.5-flash")

    content = [{"text": prompt}]

    for img in images_payload:
        base64_clean = img["image_base64"].split("base64,")[1]
        content.append({
            "inline_data": {
                "mime_type": "image/png",
                "data": base64_clean
            }
        })

    response = model.generate_content(
        content,
        generation_config={"temperature": 0.1, "max_output_tokens": 4096}
    )

    # print("RAW GEMINI OUTPUT:\n", repr(response.text))
    return json.loads(response.text)


def call_gemini_evaluation_api(prompt: str) -> dict:
    """Call Gemini API for evaluation of CV vs job description"""
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    # Configure generation parameters
    generation_config = {
        "temperature": 0.1,
        "max_output_tokens": 4096,
    }
    
     # Call the API
    response = model.generate_content(
        prompt,
        generation_config=generation_config
    )

    raw = response.text
    # print("RAW GEMINI OUTPUT:\n", repr(raw))

    # Parse JSON
    return extract_json(raw)



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

def process_cv_batch(resume_file, job_description):
    """
    Convert PDF → ONLY FIRST PAGE → Gemini extract
    """

    try:
        pdf_bytes = resume_file.read()

        # Convert only FIRST PAGE of PDF
        images = convert_from_bytes(pdf_bytes, dpi=150, fmt="png") 
        first_page = images[0]

        buffer = io.BytesIO()
        first_page.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        images_payload = [{
            "page_number": 1,
            "image_base64": f"data:image/png;base64,{b64}"
        }]

        # Build prompt
        prompt = build_gemini_prompt(job_description)

        # Gemini extraction (MUCH smaller payload now)
        extract_response = call_gemini_api(prompt, images_payload)

        return {
            "success": True,
            "results": extract_response
        }

    except Exception as e:
        logger.exception("PDF batch processing failed")
        return {
            "success": False,
            "error": str(e)
        }




# API ENDPOINTS - /api/upload_and_evaluate
@api_view(["POST"])
def evaluate_cv_vs_offer(request):
    """
     Accept multiple PDFs ("resumes")
     Extract text & data via Gemini
     Evaluate each CV vs Job Description
     Return sorted top 5 best-matching CVs
    """

    try:
        # Validate Inputs
        if "resumes" not in request.FILES:
            return Response({"error": "At least one resume PDF is required"}, status=400)

        if "job_description" not in request.data:
            return Response({"error": "Job description required"}, status=400)

        job_description = request.data["job_description"].strip()
        resume_files = request.FILES.getlist("resumes")

        # Process Each Resume (PDF → Images → Gemini Extract)
        extracted_resumes = []

        for resume_file in resume_files:
            if resume_file.size > MAX_FILE_SIZE:
                return Response(
                    {"error": f"File {resume_file.name} exceeds max size (10MB)"},
                    status=400,
                )

            extraction = process_cv_batch(resume_file, job_description)

            if not extraction["success"]:
                return Response({"error": "Gemini extraction failed"}, status=500)

            extracted_resumes.append(extraction["results"])

        # Evaluate EACH extracted resume against job description
        scored_resumes = []

        for resume_data in extracted_resumes:

            cv_text = (
                resume_data.get("resume_experience", "") + " " + " ".join(resume_data.get("competences",[]))
)

            job_text = job_description + " " + " ".join(resume_data.get("job_competences", []))

            similarity_score = semantic_similarity(cv_text, job_text)

            scored_resumes.append({
                **resume_data,
                "score_sur_100": similarity_score,
            })

        # Sort Best Scores (Descending)
        sorted_scores = sorted(
            scored_resumes,
            key=lambda x: x.get("score_sur_100", 0),
            reverse=True
        )

        top_five = sorted_scores[:5]

        # Return Clean JSON Response
        return Response({
            "success": True,
            "results_count": len(scored_resumes),
            "top_five": top_five
        }, status=200)

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