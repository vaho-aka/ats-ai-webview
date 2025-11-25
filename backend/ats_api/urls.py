from django.urls import path
from . import views

urlpatterns = [
    path('upload_and_evaluate/', views.evaluate_cv_vs_offer, name='evaluate_cv_vs_offer'),
    path('health/', views.health_check, name='health_check'),
    path("candidats/", views.list_candidats),
    path("job_offers/", views.list_job_offers),
]
