.PHONY: setup start stop clean migrate shell superuser test-backend test-frontend lint-backend lint-frontend

setup:
	docker-compose build

start:
	docker-compose up

start-detached:
	docker-compose up -d

stop:
	docker-compose down

clean:
	docker-compose down -v
	docker system prune -f

migrate:
	docker-compose exec backend python manage.py makemigrations
	docker-compose exec backend python manage.py migrate

shell:
	docker-compose exec backend python manage.py shell

superuser:
	docker-compose exec backend python manage.py createsuperuser

test-backend:
	docker-compose exec backend python manage.py test

test-frontend:
	cd frontend && npm test

lint-backend:
	cd backend && source venv/bin/activate && flake8 . || echo "Flake8 not installed"

lint-frontend:
	cd frontend && npm run lint

format-frontend:
	cd frontend && npm run format

dev-backend:
	cd backend && source venv/bin/activate && python manage.py runserver

dev-frontend:
	cd frontend && npm run dev

install-backend:
	cd backend && source venv/bin/activate && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

# Verificar si docker-compose está disponible
check-docker:
	@which docker-compose > /dev/null || (echo "docker-compose no está instalado. Instalando..." && brew install docker-compose)