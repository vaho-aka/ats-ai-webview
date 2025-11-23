import os
import base64
import io
import json
import logging
import re
from pathlib import Path

from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pdf2image import convert_from_bytes
import google.generativeai as genai
from huggingface_hub import login
from sentence_transformers import SentenceTransformer, util


logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))

# CONFIG

load_dotenv(os.path.join(BASE_DIR, ".env"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

login(token=os.getenv("HF_TOKEN"))

MAX_FILE_SIZE = 10 * 1024 * 1024

MODEL_NAME = "vahoaka/sentence-transformers-model-vahoaka-v1"
similarity_model = SentenceTransformer(MODEL_NAME)



# HELPERS

def normalize_similarity(score: float) -> float:
    """Convert -1..1 → 0..100"""
    return round((score + 1) / 2 * 100, 2)


def semantic_similarity(text_a: str, text_b: str) -> float:
    if not text_a or not text_b:
        return 0.0
    emb = similarity_model.encode([text_a, text_b], convert_to_tensor=True)
    score = util.cos_sim(emb[0], emb[1]).item()
    return normalize_similarity(score)


def extract_json(raw: str) -> dict:
    """Extract clean JSON from Gemini output"""
    raw = raw.replace("```json", "").replace("```", "").strip()

    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if not match:
        raise ValueError(f"Gemini did not return JSON: {raw}")

    return json.loads(match.group(0))



# PROMPTS

def gemini_extract_prompt(job_description: str):
    return f"""
Tu es un expert en ressources humaines.

{job_description}

Analyse le CV et l'offre d'emploi ci-joint.

OBJECTIF:
 → Extraire les informations clés et retourner en JSON strict

Format STRICT (aucune explication, aucun texte hors JSON):

{{
  "identite": {{
    "nom": "",
    "contact": {{
      "email": "",
      "telephone": "",
      "adresse": ""
    }}
  }},
  "competences": [],
  "resume_experience": "",
  "job_competences": ['liste des compétences clés extraites de la description de poste fournie i.g: "Git", "Python", "JavaScript"'],
  "job_title": ""
}}

IMPORTANT:
⚠️ Ne jamais utiliser de markdown
⚠️ Ne jamais ajouter de commentaires
⚠️ Ne pas inclure ``` ou ### ou --
⚠️ Répondre UNIQUEMENT en JSON valide
⚠️ Si un champ est introuvable → renvoyer "" au lieu d’inventer
⚠️ Ne pas déduire, uniquement extraire
"""



# GEMINI PIPELINE

def gemini_extract(pdf_bytes: bytes, job_description: str) -> dict:
    """Convert PDF first page → Gemini extract → structured dict"""

    images = convert_from_bytes(pdf_bytes, dpi=150, fmt="png")
    img = images[0]

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    prompt = gemini_extract_prompt(job_description)

    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content(
        [{"text": prompt},
         {"inline_data": {"mime_type": "image/png", "data": b64}}],
        generation_config={"temperature": 0.0}
    )

    return extract_json(response.text)



# API
# /api/evaluate_cv_vs_offer/
@api_view(["POST"])
def evaluate_cv_vs_offer(request):

    try:
        if "resumes" not in request.FILES:
            return Response({"error": "Missing resumes"}, status=400)

        if "job_description" not in request.data:
            return Response({"error": "Job description missing"}, status=400)

        job_description = request.data["job_description"].strip()

        pdfs = request.FILES.getlist("resumes")

        extracted = []

        for pdf in pdfs:
            if pdf.size > MAX_FILE_SIZE:
                return Response({"error": f"{pdf.name} too large"}, status=400)

            try:
                data = gemini_extract(pdf.read(), job_description)
                extracted.append(data)
            except Exception as e:
                logger.exception("Gemini extract failed")
                return Response({"error": f"Gemini failed: {str(e)}"}, status=500)


        scored = []

        for r in extracted:

            cv_text = r.get("resume_experience", "") + " " + " ".join(r.get("competences", []))
            job_text = job_description + " " + " ".join(r.get("job_competences", []))

            score = semantic_similarity(cv_text, job_text)

            scored.append({
                **r,
                "score_sur_100": score
            })


        ranked = sorted(scored, key=lambda x: x["score_sur_100"], reverse=True)

        return Response({
            "success": True,
            "count": len(ranked),
            "top_ranked": ranked
        })

    except Exception as e:
        logger.exception("fatal")
        return Response({"error": str(e)}, status=500)

# /api/health/
@api_view(["GET"])
def health_check(request):
    """Check if API is working"""
    return Response({
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY)
    })