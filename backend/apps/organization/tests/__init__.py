"""
Organization module test suite.

This module contains comprehensive tests for the organization wizard system including:
- Unit tests for models and services
- Integration tests for API endpoints  
- Compliance tests for Colombian health regulations
- Test factories for generating realistic test data

Test Structure:
- test_models.py: Model validation and business logic tests
- test_organization_service.py: Service layer unit tests
- test_api_integration.py: API endpoint integration tests
- test_colombian_health_compliance.py: Regulatory compliance tests
- factories.py: Test data factories using Factory Boy

To run tests:
    python manage.py test apps.organization.tests --settings=config.settings.testing
    
For coverage:
    coverage run --source='.' manage.py test apps.organization.tests --settings=config.settings.testing
    coverage report
"""