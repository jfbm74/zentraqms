#!/usr/bin/env python3
"""
API Testing Script for ZentraQMS Authentication System

This script demonstrates how to test the JWT authentication endpoints
using Python requests. Run this after setting up the Django server.

Usage:
    python test_api.py

Requirements:
    pip install requests
"""

import requests
import json
import sys
from typing import Dict


class ZentraQMSAPITester:
    """Test client for ZentraQMS Authentication API."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None

    def print_response(self, response: requests.Response, description: str = ""):
        """Print formatted API response."""
        print(f"\n{'='*60}")
        print(f"🔍 {description}")
        print(f"{'='*60}")
        print(f"Status Code: {response.status_code}")

        try:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except json.JSONDecodeError:
            print("Response (Text):")
            print(response.text)

        if response.headers.get('X-Response-Time'):
            print(f"Response Time: {response.headers['X-Response-Time']}")

    def test_health_check(self) -> bool:
        """Test health check endpoint."""
        try:
            url = f"{self.base_url}/health/"
            response = self.session.get(url)
            self.print_response(response, "Health Check")
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"❌ Health check failed: {e}")
            return False

    def test_auth_health_check(self) -> bool:
        """Test authentication health check endpoint."""
        try:
            url = f"{self.base_url}/api/auth/health/"
            response = self.session.get(url)
            self.print_response(response, "Authentication Health Check")
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"❌ Auth health check failed: {e}")
            return False

    def test_login(self, email: str, password: str) -> bool:
        """Test login endpoint."""
        url = f"{self.base_url}/api/auth/login/"
        data = {
            "email": email,
            "password": password
        }

        try:
            response = self.session.post(url, json=data)
            self.print_response(response, f"Login Test - {email}")

            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    self.access_token = data['data'].get('access')
                    self.refresh_token = data['data'].get('refresh')

                    # Set authorization header for future requests
                    if self.access_token:
                        self.session.headers.update({
                            'Authorization': f'Bearer {self.access_token}'
                        })

                    return True

            return False

        except requests.RequestException as e:
            print(f"❌ Login failed: {e}")
            return False

    def test_current_user(self) -> bool:
        """Test current user endpoint."""
        if not self.access_token:
            print("❌ Cannot test current user - no access token")
            return False

        url = f"{self.base_url}/api/auth/user/"

        try:
            response = self.session.get(url)
            self.print_response(response, "Current User Test")
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"❌ Current user test failed: {e}")
            return False

    def test_token_refresh(self) -> bool:
        """Test token refresh endpoint."""
        if not self.refresh_token:
            print("❌ Cannot test refresh - no refresh token")
            return False

        url = f"{self.base_url}/api/auth/refresh/"
        data = {"refresh": self.refresh_token}

        try:
            response = self.session.post(url, json=data)
            self.print_response(response, "Token Refresh Test")

            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    # Update tokens if new ones provided
                    new_access = data['data'].get('access')
                    new_refresh = data['data'].get('refresh')

                    if new_access:
                        self.access_token = new_access
                        self.session.headers.update({
                            'Authorization': f'Bearer {self.access_token}'
                        })

                    if new_refresh:
                        self.refresh_token = new_refresh

                    return True

            return False

        except requests.RequestException as e:
            print(f"❌ Token refresh failed: {e}")
            return False

    def test_token_verify(self) -> bool:
        """Test token verification endpoint."""
        if not self.access_token:
            print("❌ Cannot test verify - no access token")
            return False

        url = f"{self.base_url}/api/auth/verify/"
        data = {"token": self.access_token}

        try:
            response = self.session.post(url, json=data)
            self.print_response(response, "Token Verification Test")
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"❌ Token verification failed: {e}")
            return False

    def test_logout(self) -> bool:
        """Test logout endpoint."""
        if not self.refresh_token:
            print("❌ Cannot test logout - no refresh token")
            return False

        url = f"{self.base_url}/api/auth/logout/"
        data = {"refresh_token": self.refresh_token}

        try:
            response = self.session.post(url, json=data)
            self.print_response(response, "Logout Test")

            if response.status_code == 200:
                # Clear tokens
                self.access_token = None
                self.refresh_token = None
                if 'Authorization' in self.session.headers:
                    del self.session.headers['Authorization']

                return True

            return False

        except requests.RequestException as e:
            print(f"❌ Logout failed: {e}")
            return False

    def test_failed_login(self) -> bool:
        """Test login with invalid credentials."""
        url = f"{self.base_url}/api/auth/login/"
        data = {
            "email": "nonexistent@zentraqms.com",
            "password": "wrongpassword"
        }

        try:
            response = self.session.post(url, json=data)
            self.print_response(response, "Failed Login Test")
            return response.status_code == 400
        except requests.RequestException as e:
            print(f"❌ Failed login test error: {e}")
            return False

    def test_unauthorized_access(self) -> bool:
        """Test accessing protected endpoint without token."""
        # Remove authorization header
        if 'Authorization' in self.session.headers:
            del self.session.headers['Authorization']

        url = f"{self.base_url}/api/auth/user/"

        try:
            response = self.session.get(url)
            self.print_response(response, "Unauthorized Access Test")
            return response.status_code == 401
        except requests.RequestException as e:
            print(f"❌ Unauthorized access test error: {e}")
            return False

    def run_full_test_suite(self):
        """Run complete test suite."""
        print("🚀 ZentraQMS Authentication API Test Suite")
        print("=" * 60)

        results = {}

        # Test 1: Health checks
        print("\n📊 Testing Health Endpoints...")
        results['health'] = self.test_health_check()
        results['auth_health'] = self.test_auth_health_check()

        # Test 2: Failed login
        print("\n🔒 Testing Authentication Failures...")
        results['failed_login'] = self.test_failed_login()
        results['unauthorized'] = self.test_unauthorized_access()

        # Test 3: Successful authentication flow
        print("\n✅ Testing Successful Authentication Flow...")

        # Get credentials from user
        print("\n" + "="*60)
        print("🔑 Please provide test credentials:")
        email = input("Email: ").strip()
        if not email:
            email = "admin@zentraqms.com"  # Default

        password = input("Password: ").strip()
        if not password:
            print("❌ Password is required for testing")
            return

        results['login'] = self.test_login(email, password)

        if results['login']:
            results['current_user'] = self.test_current_user()
            results['token_verify'] = self.test_token_verify()
            results['token_refresh'] = self.test_token_refresh()
            results['current_user_after_refresh'] = self.test_current_user()
            results['logout'] = self.test_logout()
        else:
            print("❌ Skipping remaining tests due to login failure")

        # Summary
        self.print_test_summary(results)

    def print_test_summary(self, results: Dict[str, bool]):
        """Print test results summary."""
        print("\n" + "="*60)
        print("📋 TEST RESULTS SUMMARY")
        print("="*60)

        passed = sum(1 for result in results.values() if result)
        total = len(results)

        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title(): <30} {status}")

        print("-" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")

        if passed == total:
            print("\n🎉 All tests passed! Authentication system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check the output above for details.")


def main():
    """Main function to run the test suite."""
    import argparse

    parser = argparse.ArgumentParser(description='Test ZentraQMS Authentication API')
    parser.add_argument('--url', default='http://localhost:8000',
                        help='Base URL for the API (default: http://localhost:8000)')
    parser.add_argument('--email', help='Test email for authentication')
    parser.add_argument('--password', help='Test password for authentication')

    args = parser.parse_args()

    # Check if server is reachable
    try:
        requests.get(f"{args.url}/health/", timeout=5)
    except requests.RequestException:
        print(f"❌ Cannot connect to {args.url}")
        print("Make sure the Django development server is running:")
        print("   python manage.py runserver")
        sys.exit(1)

    # Run tests
    tester = ZentraQMSAPITester(args.url)

    if args.email and args.password:
        # Run specific login test
        print(f"🧪 Testing login with {args.email}")
        success = tester.test_login(args.email, args.password)
        if success:
            print("✅ Login successful")
            tester.test_current_user()
            tester.test_logout()
        else:
            print("❌ Login failed")
    else:
        # Run full test suite
        tester.run_full_test_suite()


if __name__ == "__main__":
    main()
