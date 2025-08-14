"""
Common abstract models for ZentraQMS.

This module contains abstract base models that provide common functionality
and fields for other models in the system.
"""

import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    """
    Abstract base model that provides timestamp fields.

    This model provides created_at and updated_at fields that are
    automatically managed by Django.
    """

    created_at = models.DateTimeField(
        _("created at"),
        auto_now_add=True,
        help_text=_("Date and time when the record was created."),
    )

    updated_at = models.DateTimeField(
        _("updated at"),
        auto_now=True,
        help_text=_("Date and time when the record was last updated."),
    )

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """
    Abstract base model that provides UUID primary key.

    This model uses UUID as the primary key for better security
    and to avoid exposing sequential IDs.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for the record."),
    )

    class Meta:
        abstract = True


class AuditModel(models.Model):
    """
    Abstract base model that provides audit fields.

    This model tracks who created and last updated a record,
    along with the timestamps.
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created",
        null=True,
        blank=True,
        verbose_name=_("created by"),
        help_text=_("User who created this record."),
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated",
        null=True,
        blank=True,
        verbose_name=_("updated by"),
        help_text=_("User who last updated this record."),
    )

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel, AuditModel):
    """
    Complete base model that combines UUID, timestamps, and audit fields.

    This model provides:
    - UUID primary key
    - Created and updated timestamps
    - Created by and updated by user tracking

    Use this as the base for most models in the system.
    """

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """
    Manager that filters out soft-deleted records by default.
    """

    def get_queryset(self):
        """
        Return queryset excluding soft-deleted records.

        Returns:
            QuerySet: Records where deleted_at is None
        """
        return super().get_queryset().filter(deleted_at__isnull=True)

    def all_with_deleted(self):
        """
        Return all records including soft-deleted ones.

        Returns:
            QuerySet: All records regardless of deletion status
        """
        return super().get_queryset()

    def deleted_only(self):
        """
        Return only soft-deleted records.

        Returns:
            QuerySet: Records where deleted_at is not None
        """
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    """
    Abstract model that provides soft delete functionality.

    Instead of actually deleting records from the database,
    this model marks them as deleted by setting deleted_at timestamp.
    """

    deleted_at = models.DateTimeField(
        _("deleted at"),
        null=True,
        blank=True,
        help_text=_("Date and time when the record was soft deleted."),
    )

    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="%(class)s_deleted",
        null=True,
        blank=True,
        verbose_name=_("deleted by"),
        help_text=_("User who soft deleted this record."),
    )

    # Use custom manager
    objects = SoftDeleteManager()

    class Meta:
        abstract = True

    def delete(self, user=None):
        """
        Soft delete the record instead of actually deleting it.

        Args:
            user: User performing the deletion (optional)
        """
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save(update_fields=["deleted_at", "deleted_by"])

    def hard_delete(self):
        """
        Actually delete the record from the database.
        """
        super().delete()

    def restore(self):
        """
        Restore a soft-deleted record.
        """
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["deleted_at", "deleted_by"])

    @property
    def is_deleted(self):
        """
        Check if the record is soft deleted.

        Returns:
            bool: True if record is soft deleted, False otherwise
        """
        return self.deleted_at is not None


class ActiveManager(models.Manager):
    """
    Manager that filters records by active status.
    """

    def get_queryset(self):
        """
        Return queryset of active records only.

        Returns:
            QuerySet: Records where is_active is True
        """
        return super().get_queryset().filter(is_active=True)


class StatusModel(models.Model):
    """
    Abstract model that provides active/inactive status functionality.
    """

    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_("Designates whether this record should be treated as active."),
    )

    # Managers
    objects = models.Manager()  # Default manager (includes inactive)
    active_objects = ActiveManager()  # Only active records

    class Meta:
        abstract = True

    def activate(self):
        """
        Mark the record as active.
        """
        self.is_active = True
        self.save(update_fields=["is_active"])

    def deactivate(self):
        """
        Mark the record as inactive.
        """
        self.is_active = False
        self.save(update_fields=["is_active"])


class FullBaseModel(BaseModel, SoftDeleteModel, StatusModel):
    """
    Complete base model with all common functionality.

    This model provides:
    - UUID primary key
    - Created and updated timestamps
    - Created by and updated by user tracking
    - Soft delete functionality
    - Active/inactive status

    Use this for models that need all features.
    """

    class Meta:
        abstract = True
