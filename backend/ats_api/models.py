from django.db import models

class Candidat(models.Model):
    nom = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=255, blank=True)
    localisation = models.CharField(max_length=255, blank=True)


class CV(models.Model):
    candidat = models.ForeignKey(Candidat, on_delete=models.CASCADE)
    texte_brut = models.TextField(null=True, blank=True)
    experience = models.TextField()
    competences = models.TextField()
    source_pdf = models.FileField(upload_to="cvs/")


class JobOffer(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField()
    competences_requises = models.TextField()


class Evaluation(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE)
    job_offer = models.ForeignKey(JobOffer, on_delete=models.CASCADE)
    score = models.FloatField()
    explanation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
