"""
Organization Service

Business logic for organization management operations.
"""

from typing import Dict, Any, Optional
from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Organization, HealthOrganization


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
            # Create organization instance with all required fields
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
            
            # Handle classification fields - support both direct and multi-sector formats
            selected_sector = form_data.get('selectedSector')
            selected_org_type = form_data.get('selectedOrgType')
            
            # ✅ FIX: Mapeo correcto de sectores del frontend al backend
            SECTOR_MAPPING = {
                'HEALTHCARE': 'salud',
                'MANUFACTURING': 'manufactura', 
                'SERVICES': 'servicios',
                'EDUCATION': 'educacion',
            }
            
            # Map multi-sector fields to classification fields
            if selected_sector:
                # Usar mapeo correcto en lugar de .lower()
                org_data['sector_economico'] = SECTOR_MAPPING.get(selected_sector, selected_sector.lower())
            elif form_data.get('sector_economico'):
                org_data['sector_economico'] = form_data.get('sector_economico')
                
            if selected_org_type:
                # Los tipos de organización ya vienen en formato correcto desde el frontend arreglado
                org_data['tipo_organizacion'] = selected_org_type.lower()
            elif form_data.get('tipo_organizacion'):
                org_data['tipo_organizacion'] = form_data.get('tipo_organizacion')
            
            # ✅ FIX: Always include classification fields with defaults
            org_data['tamaño_empresa'] = form_data.get('tamaño_empresa', 'pequeña')
            org_data['fecha_fundacion'] = form_data.get('fecha_fundacion', None)
            
            # Set defaults for fields not provided
            if not org_data.get('sector_economico'):
                org_data['sector_economico'] = 'servicios'
            if not org_data.get('tipo_organizacion'):
                org_data['tipo_organizacion'] = 'empresa_privada'
            
            # Add logo if provided
            if logo_file:
                org_data['logo'] = logo_file
            
            # Create organization
            organization = Organization.objects.create(**org_data)
            
            # ✅ FIX: Only create HealthOrganization if EXPLICITLY selected
            # Check if user explicitly selected health sector AND health-related organization type
            sector = org_data.get('sector_economico', '').lower()
            org_type = org_data.get('tipo_organizacion', '').lower()
            
            health_sector_selected = sector == 'salud'
            health_org_type_selected = org_type in ['ips', 'eps', 'clinica', 'hospital', 'centro_medico', 'laboratorio']
            
            # Only create HealthOrganization if BOTH conditions are met explicitly
            if health_sector_selected and health_org_type_selected:
                # Generate temporary unique code until user provides real REPS code
                import uuid
                temp_code = str(uuid.uuid4().int)[:12].zfill(12)  # 12-digit temporary code
                
                HealthOrganization.objects.create(
                    organization=organization,
                    codigo_prestador=temp_code,  # Temporary code - user must provide actual REPS code
                    tipo_prestador=org_type.upper() if org_type in ['ips', 'eps'] else 'IPS',
                    nivel_complejidad='I',  # Default to low complexity
                    naturaleza_juridica='privada',  # Default value
                    verificado_reps=False,  # Not verified until user provides real code
                    created_by=user
                )
            
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
            # Handle multi-sector fields mapping first
            selected_sector = form_data.get('selectedSector')
            selected_org_type = form_data.get('selectedOrgType')
            
            if selected_sector:
                form_data['sector_economico'] = selected_sector
            if selected_org_type:
                form_data['tipo_organizacion'] = selected_org_type
            
            # Update fields (exclude frontend-specific fields)
            excluded_fields = ['logo', 'logoPreview', 'selectedSector', 'selectedOrgType']
            for field, value in form_data.items():
                if field not in excluded_fields and hasattr(organization, field):
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