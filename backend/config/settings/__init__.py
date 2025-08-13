"""
Django settings package for ZentraQMS.

This package contains settings modules for different environments:
- base.py: Common settings for all environments
- development.py: Development-specific settings
- production.py: Production-specific settings
- testing.py: Testing-specific settings
"""

from .base import *

# Import specific environment settings based on DJANGO_SETTINGS_MODULE
import os
environment = os.environ.get('DJANGO_ENVIRONMENT', 'development')

if environment == 'production':
    from .production import *
elif environment == 'testing':
    from .testing import *
else:
    from .development import *