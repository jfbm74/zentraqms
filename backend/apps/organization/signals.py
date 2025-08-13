"""
Django signals for Organization module audit logging.

This module sets up automatic audit logging for Organization model changes
using Django's signal system.
"""

from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
import json
from .models import Organization, AuditLog


# Global variable to store original values before update
_organization_original_values = {}


@receiver(pre_save, sender=Organization)
def store_original_organization_values(sender, instance, **kwargs):
    """
    Store original values before Organization update for audit logging.
    
    This signal handler captures the current state of an Organization
    before it's modified, so we can log the changes.
    
    Args:
        sender: The model class (Organization)
        instance: The Organization instance being saved
        **kwargs: Additional signal arguments
    """
    if instance.pk:  # Only for updates, not creates
        try:
            # Get the current instance from database
            original_instance = Organization.objects.get(pk=instance.pk)
            
            # Convert to dictionary and store
            # Exclude file fields that may cause issues
            exclude_fields = []
            for field in original_instance._meta.fields:
                if hasattr(field, 'upload_to'):  # File/Image fields
                    exclude_fields.append(field.name)
            
            original_dict = model_to_dict(original_instance, exclude=exclude_fields)
            
            # Handle file fields separately
            for field_name in exclude_fields:
                field_value = getattr(original_instance, field_name)
                try:
                    original_dict[field_name] = str(field_value) if field_value else None
                except (ValueError, AttributeError):
                    original_dict[field_name] = None
            
            # Handle special fields that model_to_dict might not handle properly
            def serialize_field_value(value):
                """Convert field value to JSON-serializable format."""
                if value is None:
                    return None
                elif hasattr(value, 'isoformat'):  # datetime/date
                    return value.isoformat()
                elif hasattr(value, 'hex'):  # UUID
                    return str(value)
                else:
                    return value
            
            # Apply serialization to all fields
            for field_name in list(original_dict.keys()):
                original_dict[field_name] = serialize_field_value(original_dict[field_name])
            
            # Store in global variable using instance id
            _organization_original_values[instance.pk] = original_dict
            
        except Organization.DoesNotExist:
            # This is actually a create operation, not update
            _organization_original_values[instance.pk] = None


@receiver(post_save, sender=Organization)
def log_organization_change(sender, instance, created, **kwargs):
    """
    Log Organization create/update operations to audit log.
    
    This signal handler creates audit log entries whenever an Organization
    is created or updated.
    
    Args:
        sender: The model class (Organization)
        instance: The Organization instance that was saved
        created: Boolean indicating if this was a create operation
        **kwargs: Additional signal arguments
    """
    try:
        # Determine action type
        if created:
            action = AuditLog.ACTION_CREATE
            old_values = {}
            
            # Convert new instance to dict, excluding file fields
            exclude_fields = []
            for field in instance._meta.fields:
                if hasattr(field, 'upload_to'):  # File/Image fields
                    exclude_fields.append(field.name)
            
            new_values = model_to_dict(instance, exclude=exclude_fields)
            
            # Handle file fields separately
            for field_name in exclude_fields:
                field_value = getattr(instance, field_name)
                try:
                    new_values[field_name] = str(field_value) if field_value else None
                except (ValueError, AttributeError):
                    new_values[field_name] = None
                    
            changed_fields = list(new_values.keys())
        else:
            action = AuditLog.ACTION_UPDATE
            
            # Get original values stored in pre_save
            old_values = _organization_original_values.get(instance.pk, {})
            
            # Convert new instance to dict, excluding file fields
            exclude_fields = []
            for field in instance._meta.fields:
                if hasattr(field, 'upload_to'):  # File/Image fields
                    exclude_fields.append(field.name)
            
            new_values = model_to_dict(instance, exclude=exclude_fields)
            
            # Handle file fields separately
            for field_name in exclude_fields:
                field_value = getattr(instance, field_name)
                try:
                    new_values[field_name] = str(field_value) if field_value else None
                except (ValueError, AttributeError):
                    new_values[field_name] = None
            
            # Find changed fields
            changed_fields = []
            for field_name, new_value in new_values.items():
                old_value = old_values.get(field_name)
                
                # Convert both values to strings for comparison
                new_value_str = str(new_value) if new_value is not None else None
                old_value_str = str(old_value) if old_value is not None else None
                
                if new_value_str != old_value_str:
                    changed_fields.append(field_name)
        
        # Clean up stored values
        if instance.pk in _organization_original_values:
            del _organization_original_values[instance.pk]
        
        # Handle special fields for JSON serialization
        def serialize_field_value(value):
            """Convert field value to JSON-serializable format."""
            if value is None:
                return None
            elif hasattr(value, 'isoformat'):  # datetime/date
                return value.isoformat()
            elif hasattr(value, 'hex'):  # UUID
                return str(value)
            elif hasattr(value, 'url'):  # File fields (ImageField, FileField)
                try:
                    return str(value) if value else None
                except ValueError:
                    # Handle empty file fields
                    return None
            else:
                return value
        
        # Apply serialization to both dictionaries
        for values_dict in [old_values, new_values]:
            for field_name in list(values_dict.keys()):
                values_dict[field_name] = serialize_field_value(values_dict[field_name])
        
        # Get user from thread local storage if available
        user = getattr(instance, '_audit_user', None)
        request = getattr(instance, '_audit_request', None)
        reason = getattr(instance, '_audit_reason', None)
        
        # Only log if there are actual changes (for updates) or it's a create
        if created or changed_fields:
            AuditLog.log_change(
                instance=instance,
                action=action,
                user=user,
                old_values=old_values,
                new_values=new_values,
                changed_fields=changed_fields,
                request=request,
                reason=reason
            )
    
    except Exception as e:
        # Log the error but don't raise it to avoid breaking the save operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in Organization audit logging: {str(e)}")


@receiver(pre_delete, sender=Organization)
def log_organization_delete(sender, instance, **kwargs):
    """
    Log Organization delete operations to audit log.
    
    This signal handler creates audit log entries whenever an Organization
    is deleted (soft or hard delete).
    
    Args:
        sender: The model class (Organization)
        instance: The Organization instance being deleted
        **kwargs: Additional signal arguments
    """
    try:
        # Get current values before deletion
        # Exclude file fields that may cause issues
        exclude_fields = []
        for field in instance._meta.fields:
            if hasattr(field, 'upload_to'):  # File/Image fields
                exclude_fields.append(field.name)
        
        current_values = model_to_dict(instance, exclude=exclude_fields)
        
        # Handle file fields separately
        for field_name in exclude_fields:
            field_value = getattr(instance, field_name)
            try:
                current_values[field_name] = str(field_value) if field_value else None
            except (ValueError, AttributeError):
                current_values[field_name] = None
        
        # Handle special fields for JSON serialization
        def serialize_field_value(value):
            """Convert field value to JSON-serializable format."""
            if value is None:
                return None
            elif hasattr(value, 'isoformat'):  # datetime/date
                return value.isoformat()
            elif hasattr(value, 'hex'):  # UUID
                return str(value)
            elif hasattr(value, 'url'):  # File fields (ImageField, FileField)
                try:
                    return str(value) if value else None
                except ValueError:
                    # Handle empty file fields
                    return None
            else:
                return value
        
        # Apply serialization to all fields
        for field_name in list(current_values.keys()):
            current_values[field_name] = serialize_field_value(current_values[field_name])
        
        # Get user from thread local storage if available
        user = getattr(instance, '_audit_user', None)
        request = getattr(instance, '_audit_request', None)
        reason = getattr(instance, '_audit_reason', None)
        
        AuditLog.log_change(
            instance=instance,
            action=AuditLog.ACTION_DELETE,
            user=user,
            old_values=current_values,
            new_values={},
            changed_fields=list(current_values.keys()),
            request=request,
            reason=reason
        )
    
    except Exception as e:
        # Log the error but don't raise it to avoid breaking the delete operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in Organization delete audit logging: {str(e)}")


# Helper function to set audit context on model instance
def set_audit_context(instance, user=None, request=None, reason=None):
    """
    Set audit context on a model instance.
    
    This function allows views and other code to provide audit context
    (user, request, reason) that will be captured by the signal handlers.
    
    Args:
        instance: Model instance to set context on
        user: User performing the operation
        request: HTTP request object
        reason: Reason for the change
    """
    if user:
        instance._audit_user = user
    if request:
        instance._audit_request = request
    if reason:
        instance._audit_reason = reason