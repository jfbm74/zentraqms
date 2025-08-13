"""
Django settings package for ZentraQMS.

This package contains settings modules for different environments:
- base.py: Common settings for all environments
- development.py: Development-specific settings
- production.py: Production-specific settings
- testing.py: Testing-specific settings
"""

from .base import *  # noqa: F403, F401

# Import specific environment settings based on DJANGO_SETTINGS_MODULE
import os
environment = os.environ.get('DJANGO_ENVIRONMENT', 'development')

if environment == 'production':
    from .production import *  # noqa: F403, F401
elif environment == 'testing':
    from .testing import *  # noqa: F403, F401
else:
    from .development import *  # noqa: F403, F401
