"""
Tests for ZentraQMS authentication system.

This module contains comprehensive tests for the custom User model,
managers, validators, and related functionality.
"""

import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from .managers import UserManager
from .validators import (
    StrongPasswordValidator,
    validate_colombian_phone,
    validate_unique_email_case_insensitive,
    validate_password_confirmation,
)

User = get_user_model()


class UserModelTests(TestCase):
    """
    Test cases for the custom User model.
    """

    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'TestPass123!',
        }

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.check_password('TestPass123!'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_verified)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertIsInstance(user.id, uuid.UUID)

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(**self.user_data)

        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_verified)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_user_string_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), 'test@example.com')

    def test_user_full_name_property(self):
        """Test user full_name property."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.full_name, 'Test User')

        # Test with empty names
        user.first_name = ''
        user.last_name = ''
        self.assertEqual(user.full_name, 'test@example.com')

    def test_user_short_name_property(self):
        """Test user short_name property."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.short_name, 'Test')

        # Test with empty first name
        user.first_name = ''
        self.assertEqual(user.short_name, 'test@example.com')

    def test_can_login_method(self):
        """Test user can_login method."""
        user = User.objects.create_user(**self.user_data)

        # Active user should be able to login
        self.assertTrue(user.can_login())

        # Inactive user should not be able to login
        user.is_active = False
        self.assertFalse(user.can_login())

        # Locked user should not be able to login
        user.is_active = True
        user.locked_until = timezone.now() + timedelta(minutes=30)
        self.assertFalse(user.can_login())

        # User with expired lock should be able to login
        user.locked_until = timezone.now() - timedelta(minutes=30)
        self.assertTrue(user.can_login())

    def test_account_locking_methods(self):
        """Test account locking and unlocking methods."""
        user = User.objects.create_user(**self.user_data)

        # Initially not locked
        self.assertFalse(user.is_account_locked())

        # Lock account
        user.lock_account(30)
        self.assertTrue(user.is_account_locked())
        self.assertIsNotNone(user.locked_until)

        # Unlock account
        user.unlock_account()
        self.assertFalse(user.is_account_locked())
        self.assertIsNone(user.locked_until)
        self.assertEqual(user.failed_login_attempts, 0)

    def test_failed_login_attempts(self):
        """Test failed login attempts handling."""
        user = User.objects.create_user(**self.user_data)

        # Initially no failed attempts
        self.assertEqual(user.failed_login_attempts, 0)

        # Increment failed attempts
        for i in range(4):
            user.increment_failed_login()
            self.assertEqual(user.failed_login_attempts, i + 1)
            self.assertFalse(user.is_account_locked())

        # Fifth attempt should lock account
        user.increment_failed_login()
        self.assertEqual(user.failed_login_attempts, 5)
        self.assertTrue(user.is_account_locked())

        # Reset attempts
        user.reset_failed_login_attempts()
        self.assertEqual(user.failed_login_attempts, 0)

    def test_email_verification(self):
        """Test email verification functionality."""
        user = User.objects.create_user(**self.user_data)

        # Initially not verified
        self.assertFalse(user.is_verified)

        # Verify email
        user.verify_email()
        self.assertTrue(user.is_verified)

    def test_email_normalization(self):
        """Test email normalization on save."""
        user_data = self.user_data.copy()
        user_data['email'] = 'TEST@EXAMPLE.COM'

        user = User.objects.create_user(**user_data)
        self.assertEqual(user.email, 'test@example.com')

    def test_unique_email_constraint(self):
        """Test email uniqueness constraint."""
        User.objects.create_user(**self.user_data)

        # Try to create another user with same email
        with self.assertRaises(Exception):  # Should raise IntegrityError
            User.objects.create_user(**self.user_data)

    def test_organizational_info(self):
        """Test organizational information methods."""
        user = User.objects.create_user(**self.user_data)

        # Initially no organizational info
        self.assertFalse(user.has_organizational_info())

        # Add organizational info
        user.department = 'IT'
        user.position = 'Developer'
        user.save()

        self.assertTrue(user.has_organizational_info())

    def test_display_name_method(self):
        """Test get_display_name method."""
        user = User.objects.create_user(**self.user_data)

        # With full name
        self.assertEqual(user.get_display_name(), 'Test User')

        # With only first name
        user.last_name = ''
        self.assertEqual(user.get_display_name(), 'Test')

        # With no names
        user.first_name = ''
        self.assertEqual(user.get_display_name(), 'test@example.com')


class UserManagerTests(TestCase):
    """
    Test cases for the custom UserManager.
    """

    def test_create_user_without_email(self):
        """Test creating user without email raises error."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='testpass')

    def test_create_user_invalid_email(self):
        """Test creating user with invalid email raises error."""
        with self.assertRaises(ValidationError):
            User.objects.create_user(email='invalid-email', password='testpass')

    def test_create_superuser_permissions(self):
        """Test superuser creation with proper permissions."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass',
            first_name='Admin',
            last_name='User'
        )

        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_verified)

    def test_create_superuser_invalid_flags(self):
        """Test superuser creation with invalid flags raises error."""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass',
                is_staff=False
            )

        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass',
                is_superuser=False
            )

    def test_get_by_natural_key(self):
        """Test getting user by natural key (email)."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass',
            first_name='Test',
            last_name='User'
        )

        # Test case insensitive lookup
        retrieved_user = User.objects.get_by_natural_key('TEST@EXAMPLE.COM')
        self.assertEqual(user, retrieved_user)

    def test_manager_querysets(self):
        """Test custom manager querysets."""
        # Create test users
        active_user = User.objects.create_user(
            email='active@example.com',
            password='testpass',
            first_name='Active',
            last_name='User',
            is_active=True,
            is_verified=True
        )

        inactive_user = User.objects.create_user(
            email='inactive@example.com',
            password='testpass',
            first_name='Inactive',
            last_name='User',
            is_active=False
        )

        staff_user = User.objects.create_user(
            email='staff@example.com',
            password='testpass',
            first_name='Staff',
            last_name='User',
            is_staff=True
        )

        # Test active users queryset
        active_users = User.objects.active_users()
        self.assertIn(active_user, active_users)
        self.assertNotIn(inactive_user, active_users)

        # Test verified users queryset
        verified_users = User.objects.verified_users()
        self.assertIn(active_user, verified_users)
        self.assertNotIn(inactive_user, verified_users)

        # Test staff users queryset
        staff_users = User.objects.staff_users()
        self.assertIn(staff_user, staff_users)
        self.assertNotIn(active_user, staff_users)


class ValidatorTests(TestCase):
    """
    Test cases for custom validators.
    """

    def test_strong_password_validator(self):
        """Test strong password validator."""
        validator = StrongPasswordValidator()

        # Valid passwords should not raise exception
        valid_passwords = [
            'TestPass123!',
            'MySecure@Pass2024',
            'Admin#Password1',
        ]

        for password in valid_passwords:
            try:
                validator.validate(password)
            except ValidationError:
                self.fail(f'Valid password {password} raised ValidationError')

        # Invalid passwords should raise exception
        invalid_passwords = [
            'short',  # Too short
            'alllowercase123!',  # No uppercase
            'ALLUPPERCASE123!',  # No lowercase
            'NoNumbers!',  # No digits
            'NoSpecialChars123',  # No special characters
        ]

        for password in invalid_passwords:
            with self.assertRaises(ValidationError):
                validator.validate(password)

    def test_strong_password_validator_with_user_info(self):
        """Test strong password validator with user information."""
        validator = StrongPasswordValidator()

        # Create a mock user
        class MockUser:
            email = 'john.doe@example.com'
            first_name = 'John'
            last_name = 'Doe'

        user = MockUser()

        # Password containing user info should raise error
        with self.assertRaises(ValidationError):
            validator.validate('JohnPassword123!', user)

        with self.assertRaises(ValidationError):
            validator.validate('DoePassword123!', user)

    def test_colombian_phone_validator(self):
        """Test Colombian phone number validator."""
        # Valid phone numbers
        valid_phones = [
            '3001234567',
            '+573001234567',
            '573001234567',
            '016041234',  # Landline
            '+57016041234',
        ]

        for phone in valid_phones:
            try:
                validate_colombian_phone(phone)
            except ValidationError:
                self.fail(f'Valid phone {phone} raised ValidationError')

        # Invalid phone numbers
        invalid_phones = [
            '123',  # Too short
            '+1234567890',  # Wrong country code  
            'abc1234567',  # Non-numeric characters
        ]

        for phone in invalid_phones:
            with self.assertRaises(ValidationError, msg=f"Phone {phone} should be invalid but passed validation"):
                validate_colombian_phone(phone)

    def test_unique_email_validator(self):
        """Test unique email validator."""
        # Create a user
        User.objects.create_user(
            email='existing@example.com',
            password='testpass',
            first_name='Existing',
            last_name='User'
        )

        # Existing email should raise error
        with self.assertRaises(ValidationError):
            validate_unique_email_case_insensitive('existing@example.com')

        # Case insensitive check
        with self.assertRaises(ValidationError):
            validate_unique_email_case_insensitive('EXISTING@EXAMPLE.COM')

        # New email should not raise error
        try:
            validate_unique_email_case_insensitive('new@example.com')
        except ValidationError:
            self.fail('New email raised ValidationError')

    def test_password_confirmation_validator(self):
        """Test password confirmation validator."""
        # Matching passwords should not raise error
        try:
            validate_password_confirmation('testpass', 'testpass')
        except ValidationError:
            self.fail('Matching passwords raised ValidationError')

        # Non-matching passwords should raise error
        with self.assertRaises(ValidationError):
            validate_password_confirmation('testpass1', 'testpass2')


class ModelMetaTests(TestCase):
    """
    Test cases for model metadata and configuration.
    """

    def test_user_meta_configuration(self):
        """Test User model meta configuration."""
        meta = User._meta

        # Check table name
        self.assertEqual(meta.db_table, 'auth_user')

        # Check verbose names (should be in Spanish)
        self.assertEqual(str(meta.verbose_name), 'Usuario')
        self.assertEqual(str(meta.verbose_name_plural), 'Usuarios')

        # Check ordering
        self.assertEqual(meta.ordering, ['email'])

        # Check indexes
        index_fields = [index.fields for index in meta.indexes]
        self.assertIn(['email'], index_fields)
        self.assertIn(['is_active', 'is_verified'], index_fields)

    def test_username_field_configuration(self):
        """Test username field configuration."""
        self.assertEqual(User.USERNAME_FIELD, 'email')
        self.assertEqual(User.REQUIRED_FIELDS, ['first_name', 'last_name'])

    def test_model_field_properties(self):
        """Test model field properties."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass',
            first_name='Test',
            last_name='User'
        )

        # Check UUID field
        self.assertIsInstance(user.id, uuid.UUID)

        # Check email field uniqueness
        email_field = User._meta.get_field('email')
        self.assertTrue(email_field.unique)

        # Check default values
        self.assertFalse(user.is_verified)
        self.assertEqual(user.failed_login_attempts, 0)
        self.assertIsNone(user.locked_until)
        self.assertIsNone(user.last_login_ip)
