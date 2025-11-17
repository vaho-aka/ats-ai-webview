from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# BASE MODEL - Adds timestamps to all models
class TimeStampedModel(models.Model):
    """Automatically adds created_at and updated_at to models"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


# RECRUITER - Person who uploads CVs
class Recruiter(TimeStampedModel):
    """Recruiter who manages CVs and job offers"""
    nom = models.CharField(max_length=150, verbose_name="Full Name")
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ("admin", "Administrator"),
            ("recruteur", "Recruiter"),
        ],
        default="recruteur"
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.nom


# CANDIDATE - Job applicant
class Candidat(TimeStampedModel):
    """Candidate who applies for jobs"""
    nom = models.CharField(max_length=150, verbose_name="Last Name")
    prenom = models.CharField(max_length=150, verbose_name="First Name")
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=50, blank=True)
    localisation = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"


# CV/RESUME - Candidate's resume
class CV(TimeStampedModel):
    """Resume with PDF file and AI analysis"""
    candidat = models.ForeignKey(Candidat, on_delete=models.CASCADE, related_name="cvs")
    
    experience = models.TextField(blank=False, verbose_name="AI Summary")
    source_pdf = models.FileField(upload_to="cvs/%Y/%m/%d/")
    competences = models.TextField(blank=False, verbose_name="AI Extracted Skills")

    def __str__(self):
        return f"CV {self.pk} - {self.candidat}"

# JOB OFFER - Available position
class JobOffer(TimeStampedModel):
    """Job posting"""
    description = models.TextField(verbose_name="Job Description")
    competences_requises = models.TextField(blank=True, verbose_name="Required Skills")

    def __str__(self):
        return self.titre


# EVALUATION - CV vs Job Offer match
class EvaluationPair(TimeStampedModel):
    """Evaluation of how well a CV matches a job offer"""
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name="evaluations")
    offre = models.ForeignKey(JobOffer, on_delete=models.CASCADE, related_name="evaluations")
    
    # Scores (0-100)
    score_genai = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="AI Score"
    )
    
    commentaire = models.TextField(blank=True, verbose_name="Comments")
    date_evaluation = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cv', 'offre')

    def __str__(self):
        return f"{self.cv.candidat} → {self.offre.titre}"