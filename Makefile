.PHONY: help up down restart destroy update update-hard logs logs-api logs-website logs-notificator logs-tg-bot ps build rebuild

# Compose file selection based on mode
ifeq ($(mode),lite)
	COMPOSE_FILE = -f docker-compose.lite.yml
	MODE_NAME = lite
else
	COMPOSE_FILE = -f docker-compose.yml
	MODE_NAME = full
endif

help: ## Show this help message
	@echo 'Usage: make [target] [mode=lite]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''
	@echo 'Modes:'
	@echo '  mode=lite  - Use docker-compose.lite.yml (without notificator and tg-bot)'
	@echo '  (default)  - Use docker-compose.yml (all services)'

up: ## Start all services
	@echo "Starting all services ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) up -d
	@echo "Services started. Check status with: make ps"

down: ## Stop all services
	@echo "Stopping all services ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) down
	@echo "Services stopped."

restart: ## Restart all services
	@echo "Restarting all services ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) restart
	@echo "Services restarted."

destroy: ## Stop services and remove volumes
	@echo "Stopping services and removing volumes ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) down -v
	@echo "Removing volumes directory..."
	rm -rf volumes/
	@echo "All services stopped and volumes removed."

update: ## Update project from git and rebuild (without destroying data)
	@echo "Updating project from git..."
	git pull
	@echo "Rebuilding and restarting services ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) up -d --build
	@echo "Update completed."

update-hard: ## Update project from git with full rebuild (destroys all data)
	@echo "Updating project from git..."
	git pull
	@echo "Destroying existing containers and volumes ($(MODE_NAME) mode)..."
	$(MAKE) destroy mode=$(mode)
	@echo "Building and starting services..."
	docker compose $(COMPOSE_FILE) up -d --build
	@echo "Hard update completed."

logs: ## Show logs from all services
	docker compose $(COMPOSE_FILE) logs -f

logs-api: ## Show logs from API service
	docker compose $(COMPOSE_FILE) logs -f frg-api

logs-website: ## Show logs from Frontend service
	docker compose $(COMPOSE_FILE) logs -f frg-website

logs-notificator: ## Show logs from Notificator service
	@if [ "$(mode)" = "lite" ]; then \
		echo "Notificator service is not available in lite mode"; \
		exit 1; \
	fi
	docker compose $(COMPOSE_FILE) logs -f frg-notificator

logs-tg-bot: ## Show logs from Telegram Bot service
	@if [ "$(mode)" = "lite" ]; then \
		echo "Telegram Bot service is not available in lite mode"; \
		exit 1; \
	fi
	docker compose $(COMPOSE_FILE) logs -f frg-tg-bot

ps: ## Show status of all services
	docker compose $(COMPOSE_FILE) ps

build: ## Build all services without starting
	@echo "Building all services ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) build
	@echo "Build completed."

rebuild: ## Rebuild and restart all services
	@echo "Rebuilding all services ($(MODE_NAME) mode)..."
	docker compose $(COMPOSE_FILE) up -d --build
	@echo "Rebuild completed."

