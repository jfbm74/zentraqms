#!/usr/bin/env python
"""
Script to create admin user for ZentraQMS
"""
import os
import sys
import django
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

User = get_user_model()

# Admin email
admin_email = 'admin@zentraqms.com'

# Check if admin user already exists
if User.objects.filter(email=admin_email).exists():
    print("Admin user already exists!")
    admin_user = User.objects.get(email=admin_email)
    # Update password
    admin_user.set_password('123456')
    admin_user.save()
    print("Admin password updated to: 123456")
else:
    # Create admin user
    admin_user = User.objects.create_superuser(
        email=admin_email,
        password='123456',
        first_name='Admin',
        last_name='User',
        department='IT',
        position='System Administrator'
    )
    print("Admin user created successfully!")
    print(f"Email: {admin_email}")
    print("Password: 123456")

print("\nAdmin user details:")
print(f"ID: {admin_user.id}")
print(f"Email: {admin_user.email}")
print(f"First Name: {admin_user.first_name}")
print(f"Last Name: {admin_user.last_name}")
print(f"Is Staff: {admin_user.is_staff}")
print(f"Is Superuser: {admin_user.is_superuser}")
print(f"Is Active: {admin_user.is_active}")
