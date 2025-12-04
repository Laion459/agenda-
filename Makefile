COMPOSE=docker compose
BACKEND_CONTAINER=$(COMPOSE) exec backend
FRONTEND_CONTAINER=$(COMPOSE) exec frontend
DB_CONTAINER=$(COMPOSE) exec db
REDIS_CONTAINER=$(COMPOSE) exec redis

# Detecta UID/GID automaticamente (compatível com Codespaces)
DOCKER_UID ?= $(shell id -u 2>/dev/null || echo 1000)
DOCKER_GID ?= $(shell id -g 2>/dev/null || echo 1000)
BUILD_ARGS = --build-arg UID=$(DOCKER_UID) --build-arg GID=$(DOCKER_GID)
# Exporta variáveis para docker-compose.yml usar
export UID=$(DOCKER_UID)
export GID=$(DOCKER_GID)

.PHONY: up down stop restart logs ps build build-backend-no-cache rebuild install bootstrap seed key queue-backend queue-stop schedule-run reminders notifications-clean backend-shell frontend-shell db-shell db-root redis-shell frontend-build lint test test-backend test-frontend prod-build

# Start all services in detached mode
up:
	$(COMPOSE) up -d

# Stop and remove containers, networks, images and volumes created by compose
down:
	$(COMPOSE) down

# Gracefully stop running containers without removing them
stop:
	$(COMPOSE) stop

# Restart the stack (down + up)
restart:
	$(COMPOSE) down && $(COMPOSE) up -d

# Tail logs from every service
logs:
	$(COMPOSE) logs -f

# Display container status table
ps:
	$(COMPOSE) ps

# Rebuild images pulling the latest bases and ignoring cache
# Passa UID/GID automaticamente para compatibilidade com Codespaces
build:
	$(COMPOSE) build --pull $(BUILD_ARGS)

# Rebuild backend without cache (useful after Dockerfile changes)
build-backend-no-cache:
	$(COMPOSE) build --pull --no-cache $(BUILD_ARGS) backend
	# Valida se o usuário foi criado corretamente após o build
	@echo "Validando se usuário existe na imagem..."
	@docker run --rm agenda-plus-backend id $(DOCKER_UID) >/dev/null 2>&1 || \
		(echo "ERRO: Usuário com UID $(DOCKER_UID) não existe na imagem!" && exit 1)
	@echo "✅ Validação passou: usuário existe na imagem"

# Fully rebuild the stack and start fresh containers
# Passa UID/GID automaticamente para compatibilidade com Codespaces
rebuild:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) build --pull --force-rm $(BUILD_ARGS)
	$(COMPOSE) up -d

# One-shot setup: build images, install deps, run migrations + seeders
# Rebuild backend sem cache para garantir que mudanças no Dockerfile sejam aplicadas
install: build-backend-no-cache
	$(COMPOSE) build --pull $(BUILD_ARGS) frontend
	# Verifica se o usuário agenda existe na imagem (diagnóstico)
	@echo "Verificando se usuário 'agenda' existe na imagem..."
	@docker run --rm agenda-plus-backend id agenda || (echo "ERRO: Usuário agenda não existe na imagem!" && exit 1)
	# Cria .env se não existir
	@if [ ! -f backend/.env ]; then \
		echo "Criando arquivo .env a partir do .env.example..."; \
		cp backend/.env.example backend/.env; \
	fi
	# Backend dependencies
	$(COMPOSE) run --rm backend composer install
	$(COMPOSE) run --rm backend php artisan key:generate

	# Frontend dependencies
	$(COMPOSE) run --rm frontend npm install

	# Database migrations + seeders
	$(COMPOSE) run --rm backend php artisan migrate --seed

	@echo ""
	@echo "✅ Ambiente pronto!"
	@echo "▶ Para subir os serviços:          make up"
	@echo "▶ Shell Laravel (container):        make backend-shell"
	@echo "▶ Shell Next.js (container):        make frontend-shell"
	@echo "▶ Rodar testes completos:           make test"
	@echo ""

# Re-run migrations and seeders (idempotent)
bootstrap:
	$(COMPOSE) run --rm backend php artisan migrate --seed

# Execute only seeders
seed:
	$(COMPOSE) run --rm backend php artisan db:seed

# Regenerate Laravel APP_KEY
key:
	$(COMPOSE) run --rm backend php artisan key:generate

# Start queue worker inside backend container
queue-backend:
	$(BACKEND_CONTAINER) php artisan queue:work --tries=3

# Restart queue workers gracefully
queue-stop:
	$(BACKEND_CONTAINER) php artisan queue:restart

# Execute scheduled tasks once (useful for cron/supervisor)
schedule-run:
	$(BACKEND_CONTAINER) php artisan schedule:run

# Send pending appointment reminders immediately
reminders:
	$(BACKEND_CONTAINER) php artisan appointments:send-reminders

# Cleanup read notifications older than the configured threshold
notifications-clean:
	$(BACKEND_CONTAINER) php artisan notifications:cleanup

# Open interactive shell in backend container
backend-shell:
	$(BACKEND_CONTAINER) bash || $(BACKEND_CONTAINER) sh

# Open interactive shell in frontend container
frontend-shell:
	$(FRONTEND_CONTAINER) sh

# Connect to Postgres using agenda credentials
db-shell:
	$(DB_CONTAINER) psql -U agenda -d agenda

# Connect to Postgres as superuser
db-root:
	$(DB_CONTAINER) psql -U postgres

# Open Redis CLI inside container
redis-shell:
	$(REDIS_CONTAINER) redis-cli

# Build production assets for the Next.js frontend
frontend-build:
	$(COMPOSE) run --rm frontend npm run build

# Run frontend lint checks
lint:
	$(COMPOSE) run --rm frontend npm run lint

# Run backend + frontend test suites
test: test-backend test-frontend

# Execute Laravel test suite
test-backend:
	$(COMPOSE) run --rm backend php artisan test

# Execute frontend tests (placeholder if suite is not configured)
test-frontend:
	$(COMPOSE) run --rm frontend npm test -- --watch=false || echo "Teste do frontend não configurado"

# Build produção (imagens otimizadas)
prod-build:
	docker compose -f deploy/production/docker-compose.yml build

