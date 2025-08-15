"""
Organization Service

Business logic for organization management operations.
"""

from typing import Dict, Any, Optional
from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Organization


class OrganizationService:
    """
    Service class for handling organization business logic.
    """
    
    @staticmethod
    def create_organization(
        user,
        form_data: Dict[str, Any],
        logo_file: Optional[Any] = None
    ) -> Organization:
        """
        Create a new organization with the provided data.
        
        Args:
            user: User creating the organization
            form_data: Organization form data
            logo_file: Logo file (optional)
            
        Returns:
            Organization: Created organization instance
            
        Raises:
            ValidationError: If validation fails
        """
        with transaction.atomic():
            # Create organization instance
            org_data = {
                'razon_social': form_data.get('razon_social'),
                'nit': form_data.get('nit'),
                'digito_verificacion': form_data.get('digito_verificacion'),
                'email_contacto': form_data.get('email_contacto'),
                'telefono_principal': form_data.get('telefono_principal'),
                'website': form_data.get('website', ''),
                'descripcion': form_data.get('descripcion', ''),
                'created_by': user,
            }
            
            # Add logo if provided
            if logo_file:
                org_data['logo'] = logo_file
            
            organization = Organization.objects.create(**org_data)
            
            return organization
    
    @staticmethod
    def update_organization(
        organization: Organization,
        user,
        form_data: Dict[str, Any],
        logo_file: Optional[Any] = None
    ) -> Organization:
        """
        Update an existing organization.
        
        Args:
            organization: Organization instance to update
            user: User updating the organization
            form_data: Updated form data
            logo_file: New logo file (optional)
            
        Returns:
            Organization: Updated organization instance
        """
        with transaction.atomic():
            # Update fields
            for field, value in form_data.items():
                if field not in ['logo', 'logoPreview'] and hasattr(organization, field):
                    setattr(organization, field, value)
            
            # Update logo if provided
            if logo_file:
                organization.logo = logo_file
            
            organization.save()
            
            return organization
    
    @staticmethod
    def validate_nit(nit: str) -> Dict[str, Any]:
        """
        Validate NIT availability and format.
        
        Args:
            nit: NIT to validate
            
        Returns:
            Dict: Validation result with availability and message
        """
        # Check if NIT already exists
        exists = Organization.objects.filter(
            nit=nit,
            deleted_at__isnull=True
        ).exists()
        
        if exists:
            return {
                'is_available': False,
                'message': 'Este NIT ya está registrado en el sistema'
            }
        
        return {
            'is_available': True,
            'message': 'NIT disponible'
        }
    
    @staticmethod
    def get_organization_summary(organization: Organization) -> Dict[str, Any]:
        """
        Get organization summary data.
        
        Args:
            organization: Organization instance
            
        Returns:
            Dict: Organization summary data
        """
        return {
            'id': str(organization.id),
            'razon_social': organization.razon_social,
            'nit': organization.nit,
            'digito_verificacion': organization.digito_verificacion,
            'email_contacto': organization.email_contacto,
            'telefono_principal': organization.telefono_principal,
            'website': organization.website,
            'descripcion': organization.descripcion,
            'logo_url': organization.logo.url if organization.logo else None,
            'created_at': organization.created_at,
            'updated_at': organization.updated_at,
        }