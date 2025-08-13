#!/bin/bash

# ZentraQMS Backend Development Setup Script
# This script sets up the development environment for the authentication system

echo "🚀 ZentraQMS Backend Development Setup"
echo "======================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p media
mkdir -p static

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# Django Configuration
SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -base64 32)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
DATABASE_URL=sqlite:///db.sqlite3

# JWT Configuration
JWT_ACCESS_TOKEN_LIFETIME=30
JWT_REFRESH_TOKEN_LIFETIME=7

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional: Email Configuration (for future features)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@zentraqms.com

# Optional: Redis Configuration (for future caching)
REDIS_URL=redis://localhost:6379/1
EOF
    echo "✅ .env file created with default values"
else
    echo "ℹ️  .env file already exists"
fi

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser prompt
echo ""
echo "👤 Would you like to create a superuser account? (y/n)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

# Run tests to verify setup
echo ""
echo "🧪 Running authentication tests..."
python manage.py test apps.authentication --verbosity=1

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Activate virtual environment: source venv/bin/activate"
echo "   2. Start development server: python manage.py runserver"
echo "   3. Test API endpoints: python test_api.py"
echo "   4. Access Django Admin: http://localhost:8000/admin/"
echo "   5. API Documentation: Check AUTHENTICATION_SETUP.md"
echo ""
echo "🔍 API Endpoints:"
echo "   • Health Check: GET /health/"
echo "   • Login: POST /api/auth/login/"
echo "   • Current User: GET /api/auth/user/"
echo "   • Token Refresh: POST /api/auth/refresh/"
echo "   • Logout: POST /api/auth/logout/"
echo ""
echo "Happy coding! 🎉"