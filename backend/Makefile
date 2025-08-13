# ZentraQMS Backend Makefile
# Common commands for development and deployment

.PHONY: help install install-dev migrate createsuperuser runserver test coverage clean format lint check deploy

# Default target
help:
	@echo "ZentraQMS Backend - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  install      Install production dependencies"
	@echo "  install-dev  Install development dependencies"
	@echo "  migrate      Run database migrations"
	@echo "  makemigrations Create new migrations"
	@echo "  createsuperuser Create a superuser account"
	@echo "  runserver    Start development server"
	@echo "  shell        Start Django shell"
	@echo ""
	@echo "Testing:"
	@echo "  test         Run all tests"
	@echo "  test-fast    Run tests with --keepdb and --parallel"
	@echo "  coverage     Run tests with coverage report"
	@echo "  test-models  Run model tests only"
	@echo ""
	@echo "Code Quality:"
	@echo "  format       Format code with black and isort"
	@echo "  lint         Run flake8 linting"
	@echo "  typecheck    Run mypy type checking"
	@echo "  check        Run all quality checks"
	@echo ""
	@echo "Database:"
	@echo "  dbshell      Open database shell"
	@echo "  dbdump       Create database backup"
	@echo "  dbreset      Reset database (CAUTION!)"
	@echo ""
	@echo "Deployment:"
	@echo "  collectstatic Collect static files"
	@echo "  deploy-check  Run deployment checks"
	@echo "  clean        Clean up temporary files"

# Installation
install:
	pip install -r requirements/base.txt

install-dev:
	pip install -r requirements/development.txt

# Database
migrate:
	python manage.py migrate

makemigrations:
	python manage.py makemigrations

createsuperuser:
	python manage.py createsuperuser

dbshell:
	python manage.py dbshell

dbdump:
	python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > backup_$(shell date +%Y%m%d_%H%M%S).json

dbreset:
	@echo "WARNING: This will delete all data!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read
	python manage.py flush --noinput
	python manage.py migrate

# Development
runserver:
	python manage.py runserver 0.0.0.0:8000

shell:
	python manage.py shell_plus

# Testing
test:
	python manage.py test --settings=config.settings.testing

test-fast:
	python manage.py test --settings=config.settings.testing --keepdb --parallel

test-models:
	python manage.py test apps.authentication.tests --settings=config.settings.testing

coverage:
	coverage run --source='.' manage.py test --settings=config.settings.testing
	coverage report
	coverage html

# Code Quality
format:
	black .
	isort .

lint:
	flake8 .

typecheck:
	mypy .

check: lint typecheck
	python manage.py check --deploy
	python manage.py check --database

# Static files
collectstatic:
	python manage.py collectstatic --noinput

# Deployment
deploy-check:
	python manage.py check --deploy
	python manage.py check --database
	python manage.py makemigrations --check --dry-run

# Cleanup
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.log" -delete
	rm -rf .coverage htmlcov/
	rm -rf .pytest_cache
	rm -rf .mypy_cache

# Docker commands (if using Docker)
docker-build:
	docker build -t zentraqms-backend .

docker-run:
	docker run -p 8000:8000 zentraqms-backend

# Load sample data (for development)
loaddata:
	python manage.py loaddata fixtures/sample_users.json

# Create sample data
createdata:
	python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin@zentraqms.com', 'Admin123!', first_name='Admin', last_name='User') if not User.objects.filter(email='admin@zentraqms.com').exists() else None"

# Backup and restore
backup:
	mkdir -p backups
	python manage.py dumpdata --natural-foreign --natural-primary > backups/backup_$(shell date +%Y%m%d_%H%M%S).json

restore:
	@echo "Enter backup file path:"
	@read backup_file; python manage.py loaddata $$backup_file

# Environment setup
setup-dev: install-dev migrate createdata
	@echo "Development environment setup complete!"
	@echo "Run 'make runserver' to start the development server"

# Production setup
setup-prod: install migrate collectstatic
	@echo "Production environment setup complete!"

# Log management
logs:
	tail -f logs/django.log

clear-logs:
	> logs/django.log
	> logs/errors.log

# Security checks
security-check:
	python manage.py check --deploy
	safety check

# Performance testing
load-test:
	locust -f tests/load_tests.py

# API documentation
docs:
	python manage.py spectacular --file schema.yml
	@echo "API schema generated: schema.yml"

# Django commands shortcuts
mm: makemigrations
m: migrate
rs: runserver
t: test
s: shell