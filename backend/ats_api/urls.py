# backend/cv_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_and_analyze_cv, name='upload_and_analyze_cv'),
    path('evaluate/', views.evaluate_cv_vs_offer, name='evaluate_cv_vs_offer'),
    path('health/', views.health_check, name='health_check'),
    path('list/', views.list_evaluation_pairs, name='list_evaluation_pairs'),
]
