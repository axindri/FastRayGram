.DEFAULT_GOAL := help

COMPOSE := docker compose

ifeq ($(MODE),dev)
  COMPOSE_FILE := docker-compose.dev.yml
else
  COMPOSE_FILE := docker-compose.yml
endif

COMPOSE_ARGS := -f $(COMPOSE_FILE)

.PHONY: help update start stop restart

help:
	@echo "Fast Ray Gram"
	@echo ""
	@echo "  make update          git pull + пересборка образов (+ frontend build в prod)"
	@echo "  make start           запуск в фоне (prod: docker-compose.yml)"
	@echo "  make stop            остановка и удаление контейнеров"
	@echo "  make restart         stop, затем start"
	@echo ""
	@echo "Dev-режим: добавьте MODE=dev к любой команде"
	@echo "  make start MODE=dev"
	@echo "  make stop MODE=dev"
	@echo "  make restart MODE=dev"
	@echo "  make update MODE=dev"

update:
	git pull --ff-only
	$(COMPOSE) $(COMPOSE_ARGS) build --pull
ifneq ($(MODE),dev)
	cd frontend && npm ci && npm run build
endif

start:
	$(COMPOSE) $(COMPOSE_ARGS) up -d --build

stop:
	$(COMPOSE) $(COMPOSE_ARGS) down

restart: stop start
