#!/bin/bash

# 🔍 Local CI checks script
# Run this before pushing to ensure CI will pass

set -e

echo "🚀 Running local CI checks..."

# Frontend checks
echo "🎨 Checking frontend..."
cd frontend
npm ci
npm run lint
npm run test:coverage
npm run build
cd ..

# Backend checks  
echo "🔧 Checking backend..."
cd backend
source venv/bin/activate
pip install -r requirements/testing.txt
flake8 .
black --check .
python manage.py test
cd ..

echo "✅ All checks passed! Ready to push."
