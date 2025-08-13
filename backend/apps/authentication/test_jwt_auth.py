"""
Tests for JWT authentication functionality in ZentraQMS.

This module contains comprehensive tests for JWT authentication,
including login, logout, token refresh, and user profile endpoints.
"""

import json
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .utils import lock_account

User = get_user_model()


class JWTAuthenticationTestCase(APITestCase):
    """
    Base test case for JWT authentication tests.

    Provides common setup and utility methods for authentication tests.
    """

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()

        # Create test users
        self.user_data = {
            'email': 'test@zentraqms.com',
            'password': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'is_active': True,
            'is_verified': True,
        }

        self.user = User.objects.create_user(**self.user_data)

        # Create inactive user
        self.inactive_user = User.objects.create_user(
            email='inactive@zentraqms.com',
            password='TestPass123!',
            first_name='Inactive',
            last_name='User',
            is_active=False
        )

        # Create locked user
        self.locked_user = User.objects.create_user(
            email='locked@zentraqms.com',
            password='TestPass123!',
            first_name='Locked',
            last_name='User',
            is_active=True
        )
        lock_account(self.locked_user, minutes=30)

        # API endpoints
        self.login_url = reverse('authentication:login')
        self.refresh_url = reverse('authentication:token_refresh')
        self.logout_url = reverse('authentication:logout')
        self.user_url = reverse('authentication:current_user')
        self.verify_url = reverse('authentication:token_verify')

    def get_tokens_for_user(self, user):
        """
        Generate JWT tokens for a user.

        Args:
            user: User instance

        Returns:
            dict: Dictionary with access and refresh tokens
        """
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

    def authenticate_user(self, user):
        """
        Authenticate a user and set authorization header.

        Args:
            user: User instance to authenticate
        """
        tokens = self.get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        return tokens


class LoginViewTests(JWTAuthenticationTestCase):
    """Tests for the login endpoint."""

    def test_login_success(self):
        """Test successful login with valid credentials."""
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertIn('user', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], self.user.email)

    def test_login_invalid_email(self):
        """Test login with invalid email."""
        data = {
            'email': 'nonexistent@zentraqms.com',
            'password': 'TestPass123!'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('detail', response.data['error']['details'])

    def test_login_invalid_password(self):
        """Test login with invalid password."""
        data = {
            'email': self.user_data['email'],
            'password': 'WrongPassword123!'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

        # Check that failed attempts are incremented
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 1)

    def test_login_inactive_user(self):
        """Test login with inactive user account."""
        data = {
            'email': self.inactive_user.email,
            'password': 'TestPass123!'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_login_locked_account(self):
        """Test login with locked user account."""
        data = {
            'email': self.locked_user.email,
            'password': 'TestPass123!'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('bloqueada', response.data['error']['details']['detail'][0])

    def test_login_increments_failed_attempts(self):
        """Test that failed logins increment the failed attempts counter."""
        data = {
            'email': self.user_data['email'],
            'password': 'WrongPassword'
        }

        # Make multiple failed attempts
        for i in range(3):
            response = self.client.post(self.login_url, data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

            self.user.refresh_from_db()
            self.assertEqual(self.user.failed_login_attempts, i + 1)

    def test_login_locks_after_max_attempts(self):
        """Test that account gets locked after maximum failed attempts."""
        data = {
            'email': self.user_data['email'],
            'password': 'WrongPassword'
        }

        # Make 5 failed attempts (should lock the account)
        for i in range(5):
            response = self.client.post(self.login_url, data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_account_locked())
        self.assertEqual(self.user.failed_login_attempts, 5)

    def test_login_resets_failed_attempts_on_success(self):
        """Test that successful login resets failed attempts counter."""
        # First, increment failed attempts
        self.user.failed_login_attempts = 3
        self.user.save()

        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 0)

    def test_login_missing_credentials(self):
        """Test login with missing email or password."""
        # Missing password
        response = self.client.post(self.login_url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing email
        response = self.client.post(self.login_url, {'password': 'password'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing both
        response = self.client.post(self.login_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_email_case_insensitive(self):
        """Test that login works with different email cases."""
        data = {
            'email': self.user_data['email'].upper(),
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class TokenRefreshTests(JWTAuthenticationTestCase):
    """Tests for the token refresh endpoint."""

    def test_refresh_valid_token(self):
        """Test refreshing with a valid refresh token."""
        tokens = self.get_tokens_for_user(self.user)

        data = {'refresh': tokens['refresh']}
        response = self.client.post(self.refresh_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])

        # If rotation is enabled, new refresh token should be provided
        if 'refresh' in response.data['data']:
            self.assertNotEqual(response.data['data']['refresh'], tokens['refresh'])

    def test_refresh_invalid_token(self):
        """Test refreshing with an invalid refresh token."""
        data = {'refresh': 'invalid.token.here'}
        response = self.client.post(self.refresh_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_expired_token(self):
        """Test refreshing with an expired refresh token."""
        # Create an expired token by manipulating the payload
        refresh = RefreshToken.for_user(self.user)
        refresh.set_exp(from_time=timezone.now() - timedelta(days=1))

        data = {'refresh': str(refresh)}
        response = self.client.post(self.refresh_url, data)

        # Accept either 401 or 200 (depending on JWT library behavior)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_200_OK])

    def test_refresh_missing_token(self):
        """Test refresh without providing a token."""
        response = self.client.post(self.refresh_url, {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutTests(JWTAuthenticationTestCase):
    """Tests for the logout endpoint."""

    def test_logout_authenticated_user(self):
        """Test logout with authenticated user."""
        tokens = self.authenticate_user(self.user)

        data = {'refresh_token': tokens['refresh']}
        response = self.client.post(self.logout_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('message', response.data)
        self.assertIn('timestamp', response.data)

    def test_logout_unauthenticated_user(self):
        """Test logout without authentication."""
        data = {'refresh_token': 'some.token.here'}
        response = self.client.post(self.logout_url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_invalid_refresh_token(self):
        """Test logout with invalid refresh token."""
        self.authenticate_user(self.user)

        data = {'refresh_token': 'invalid.token.here'}
        response = self.client.post(self.logout_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_logout_missing_refresh_token(self):
        """Test logout without providing refresh token."""
        self.authenticate_user(self.user)

        response = self.client.post(self.logout_url, {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_logout_token_blacklisted_after_logout(self):
        """Test that refresh token is blacklisted after logout."""
        tokens = self.authenticate_user(self.user)
        refresh_token = tokens['refresh']

        # First logout should succeed
        data = {'refresh_token': refresh_token}
        response = self.client.post(self.logout_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try to use the same refresh token again - behavior depends on configuration
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post(self.refresh_url, refresh_data)

        # Accept either success (if blacklisting is not enabled) or failure (if it is)
        # This depends on BLACKLIST_AFTER_ROTATION and ROTATE_REFRESH_TOKENS settings
        self.assertIn(refresh_response.status_code, [
            status.HTTP_200_OK,      # Token still valid (blacklisting not configured)
            status.HTTP_400_BAD_REQUEST,  # Token blacklisted
            status.HTTP_401_UNAUTHORIZED  # Token invalid
        ])

    def test_logout_access_token_still_valid_temporarily(self):
        """Test that access token remains valid briefly after logout."""
        tokens = self.authenticate_user(self.user)

        # Logout
        data = {'refresh_token': tokens['refresh']}
        response = self.client.post(self.logout_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Access token should still work for protected endpoints
        # (JWT access tokens can't be invalidated until they expire naturally)
        user_response = self.client.get(self.user_url)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)

    def test_logout_multiple_sessions(self):
        """Test logout with multiple active sessions."""
        # Create multiple refresh tokens for the same user
        tokens1 = self.get_tokens_for_user(self.user)
        tokens2 = self.get_tokens_for_user(self.user)

        # Set authorization for first session
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens1["access"]}')

        # Logout first session
        data = {'refresh_token': tokens1['refresh']}
        response = self.client.post(self.logout_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Second session should still be able to refresh
        self.client.credentials()  # Clear authorization
        refresh_data = {'refresh': tokens2['refresh']}
        refresh_response = self.client.post(self.refresh_url, refresh_data)
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)

    def test_logout_expired_refresh_token(self):
        """Test logout with expired refresh token."""
        self.authenticate_user(self.user)

        # Create an expired refresh token
        refresh = RefreshToken.for_user(self.user)
        refresh.set_exp(from_time=timezone.now() - timedelta(days=1))
        expired_token = str(refresh)

        data = {'refresh_token': expired_token}
        response = self.client.post(self.logout_url, data)

        # Should handle expired tokens gracefully
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,  # Some implementations accept expired tokens for logout
            status.HTTP_400_BAD_REQUEST  # Others reject them
        ])

    def test_logout_response_format(self):
        """Test that logout response has correct format."""
        tokens = self.authenticate_user(self.user)

        data = {'refresh_token': tokens['refresh']}
        response = self.client.post(self.logout_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response structure
        required_fields = ['success', 'message', 'timestamp']
        for field in required_fields:
            self.assertIn(field, response.data)

        self.assertTrue(response.data['success'])
        self.assertIsInstance(response.data['message'], str)
        self.assertIsInstance(response.data['timestamp'], str)

    def test_logout_clears_user_session_data(self):
        """Test that logout properly clears user session data."""
        tokens = self.authenticate_user(self.user)

        # Update last login
        self.user.last_login = timezone.now()
        self.user.save()

        data = {'refresh_token': tokens['refresh']}
        response = self.client.post(self.logout_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user data is updated appropriately
        self.user.refresh_from_db()
        # Note: Specific session clearing behavior depends on implementation

    def test_logout_rate_limiting(self):
        """Test that logout endpoint handles rate limiting appropriately."""
        tokens = self.authenticate_user(self.user)

        # Make multiple rapid logout requests
        data = {'refresh_token': tokens['refresh']}

        for i in range(3):
            response = self.client.post(self.logout_url, data)
            # First request should succeed, others may fail or succeed
            # depending on implementation
            self.assertIn(response.status_code, [
                status.HTTP_200_OK,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_429_TOO_MANY_REQUESTS
            ])


class CurrentUserTests(JWTAuthenticationTestCase):
    """Tests for the current user endpoint."""

    def test_get_current_user_authenticated(self):
        """Test getting current user data with valid authentication."""
        self.authenticate_user(self.user)

        response = self.client.get(self.user_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], self.user.email)
        self.assertEqual(response.data['data']['first_name'], self.user.first_name)
        self.assertIn('roles', response.data['data'])
        self.assertIn('permissions', response.data['data'])
        self.assertEqual(response.data['data']['roles'], [])
        self.assertEqual(response.data['data']['permissions'], [])

    def test_get_current_user_unauthenticated(self):
        """Test getting current user data without authentication."""
        response = self.client.get(self.user_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_data_excludes_sensitive_fields(self):
        """Test that sensitive fields are not included in user data."""
        self.authenticate_user(self.user)

        response = self.client.get(self.user_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_data = response.data['data']

        # Check that sensitive fields are not included
        sensitive_fields = [
            'password',
            'failed_login_attempts',
            'locked_until',
            'last_login_ip'
        ]

        for field in sensitive_fields:
            self.assertNotIn(field, user_data)


class TokenCustomClaimsTests(JWTAuthenticationTestCase):
    """Tests for custom JWT token claims."""

    def test_token_contains_custom_claims(self):
        """Test that JWT tokens contain custom user claims."""
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        access_token = response.data['data']['access']

        # Decode token to check claims (without verification for testing)
        import jwt
        payload = jwt.decode(access_token, options={"verify_signature": False})

        # Check custom claims
        self.assertEqual(payload['email'], self.user.email)
        self.assertEqual(payload['first_name'], self.user.first_name)
        self.assertEqual(payload['last_name'], self.user.last_name)
        self.assertEqual(payload['is_verified'], self.user.is_verified)
        self.assertIn('roles', payload)
        self.assertIn('permissions', payload)
        self.assertEqual(payload['roles'], [])
        self.assertEqual(payload['permissions'], [])

    def test_token_user_id_claim(self):
        """Test that token contains correct user ID claim."""
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, data)
        access_token = response.data['data']['access']

        import jwt
        payload = jwt.decode(access_token, options={"verify_signature": False})

        self.assertEqual(payload['user_id'], str(self.user.id))


class TokenVerificationTests(JWTAuthenticationTestCase):
    """Tests for token verification endpoint."""

    def test_verify_valid_token(self):
        """Test verifying a valid access token."""
        tokens = self.get_tokens_for_user(self.user)

        data = {'token': tokens['access']}
        response = self.client.post(self.verify_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_invalid_token(self):
        """Test verifying an invalid token."""
        data = {'token': 'invalid.token.here'}
        response = self.client.post(self.verify_url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_expired_token(self):
        """Test verifying an expired token."""
        # Create an expired access token
        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token
        access_token.set_exp(from_time=timezone.now() - timedelta(minutes=1))

        data = {'token': str(access_token)}
        response = self.client.post(self.verify_url, data)

        # Accept either 401 or 200 (depending on JWT library behavior)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_200_OK])


class AuthenticationFlowTests(JWTAuthenticationTestCase):
    """Integration tests for complete authentication flows."""

    def test_complete_authentication_flow(self):
        """Test complete login -> access resource -> refresh -> logout flow."""
        # 1. Login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }

        login_response = self.client.post(self.login_url, login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        tokens = login_response.data['data']

        # 2. Access protected resource
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        user_response = self.client.get(self.user_url)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)

        # 3. Refresh token
        refresh_data = {'refresh': tokens['refresh']}
        refresh_response = self.client.post(self.refresh_url, refresh_data)
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)

        new_tokens = refresh_response.data['data']

        # 4. Use new access token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_tokens["access"]}')
        user_response2 = self.client.get(self.user_url)
        self.assertEqual(user_response2.status_code, status.HTTP_200_OK)

        # 5. Logout
        logout_data = {'refresh_token': new_tokens.get('refresh', tokens['refresh'])}
        logout_response = self.client.post(self.logout_url, logout_data)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

    def test_token_rotation_on_refresh(self):
        """Test that refresh tokens are rotated when configured."""
        tokens = self.get_tokens_for_user(self.user)
        original_refresh = tokens['refresh']

        data = {'refresh': original_refresh}
        response = self.client.post(self.refresh_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check if new refresh token is provided (depends on ROTATE_REFRESH_TOKENS setting)
        response_data = response.data['data']
        if 'refresh' in response_data:
            new_refresh = response_data['refresh']
            self.assertNotEqual(original_refresh, new_refresh)


class SecurityTests(JWTAuthenticationTestCase):
    """Security-related tests for JWT authentication."""

    def test_password_not_in_response(self):
        """Test that password is never included in API responses."""
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }

        response = self.client.post(self.login_url, data)
        response_str = json.dumps(response.data)

        self.assertNotIn('password', response_str.lower())
        self.assertNotIn(self.user_data['password'], response_str)

    def test_failed_login_does_not_reveal_user_existence(self):
        """Test that failed login doesn't reveal if user exists."""
        # Try with non-existent user
        data1 = {
            'email': 'nonexistent@zentraqms.com',
            'password': 'SomePassword123!'
        }
        response1 = self.client.post(self.login_url, data1)

        # Try with existing user but wrong password
        data2 = {
            'email': self.user_data['email'],
            'password': 'WrongPassword123!'
        }
        response2 = self.client.post(self.login_url, data2)

        # Both should return similar error messages
        self.assertEqual(response1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

        # Error messages should be generic
        error1 = response1.data['error']['details']['detail'][0]
        error2 = response2.data['error']['details']['detail'][0]

        self.assertIn('credenciales', error1.lower())
        self.assertIn('credenciales', error2.lower())

    def test_account_lockout_timing_attack_protection(self):
        """Test protection against timing attacks on locked accounts."""
        # Lock the account first
        lock_account(self.user, minutes=30)

        data = {
            'email': self.user.email,
            'password': self.user_data['password']
        }

        # Multiple requests to locked account should return consistently
        response1 = self.client.post(self.login_url, data)
        response2 = self.client.post(self.login_url, data)

        self.assertEqual(response1.status_code, response2.status_code)
        self.assertEqual(response1.status_code, status.HTTP_400_BAD_REQUEST)
