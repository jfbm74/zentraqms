"""
Production settings for ZentraQMS project.

This file contains settings specific to the production environment.
"""

from .base import *
from decouple import config

# Security settings
DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Production-specific apps
INSTALLED_APPS += [
    'whitenoise.runserver_nostatic',  # For static files serving
]

# Update middleware for production
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files middleware
] + MIDDLEWARE[1:]  # Add after SecurityMiddleware, before others

# CORS settings for production (restrictive)
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://yourproductiondomain.com'
).split(',')

# Static files configuration for production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

# Security settings for production
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session and CSRF settings for production
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Cache configuration for production (Redis)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session backend using cache
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Email backend for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@zentraqms.com')

# Production logging configuration
LOGGING['handlers']['file']['filename'] = BASE_DIR / 'logs' / 'production.log'
LOGGING['handlers']['console']['level'] = 'WARNING'
LOGGING['loggers']['apps']['level'] = 'INFO'
LOGGING['loggers']['django']['level'] = 'WARNING'

# Add error logging handler
LOGGING['handlers']['error_file'] = {
    'level': 'ERROR',
    'class': 'logging.FileHandler',
    'filename': BASE_DIR / 'logs' / 'errors.log',
    'formatter': 'verbose',
}

LOGGING['loggers']['django']['handlers'].append('error_file')
LOGGING['loggers']['apps']['handlers'].append('error_file')

# Celery configuration for production (if using)
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Database connection pooling for production
DATABASES['default']['CONN_MAX_AGE'] = 60

# Admin settings
ADMIN_URL = config('ADMIN_URL', default='admin/')

# Monitoring and health checks
HEALTH_CHECK_PATH = config('HEALTH_CHECK_PATH', default='/health/')

# Create logs directory
import os
os.makedirs(BASE_DIR / 'logs', exist_ok=True)