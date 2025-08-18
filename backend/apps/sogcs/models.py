"""
SOGCS Models - Sistema Obligatorio de Garantía de Calidad en Salud

Este módulo define los modelos para el sistema SOGCS que incluye:
- SUH (Sistema Único de Habilitación) - moved to organization app
- PAMEC (Programa de Auditoría para el Mejoramiento de la Calidad)
- SIC (Sistema de Información para la Calidad)
- SUA (Sistema Único de Acreditación)

Note: HeadquarterLocation and EnabledHealthService models have been moved
to apps.organization.models for better organization and to avoid conflicts.
"""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# Models moved to organization app for better structure
# Import them from there if needed:
# from apps.organization.models import HeadquarterLocation, EnabledHealthService