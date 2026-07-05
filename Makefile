.DEFAULT_GOAL := help

COMPOSE := docker compose

ifeq ($(MODE),dev)
  COMPOSE_FILE := docker-compose.dev.yml
else
  COMPOSE_FILE := docker-compose.yml
endif

COMPOSE_ARGS := -f $(COMPOSE_FILE)

.PHONY: help pull build update start stop restart

help:
	@echo "Fast Ray Gram"
	@echo ""
	@echo "  make pull            git pull"
	@echo "  make build           пересборка образов (+ frontend build в prod)"
	@echo "  make update          pull + build"
	@echo "  make start           запуск в фоне (prod: docker-compose.yml)"
	@echo "  make stop            остановка и удаление контейнеров"
	@echo "  make restart         stop, затем start"
	@echo ""
	@echo "Dev-режим: добавьте MODE=dev к любой команде"
	@echo "  make build MODE=dev"
	@echo "  make start MODE=dev"
	@echo "  make stop MODE=dev"
	@echo "  make restart MODE=dev"

pull:
	git pull --ff-only

build:
	$(COMPOSE) $(COMPOSE_ARGS) build --pull
ifneq ($(MODE),dev)
	cd frontend && npm ci && npm run build
endif

update: pull build

start:
	$(COMPOSE) $(COMPOSE_ARGS) up -d --build

stop:
	$(COMPOSE) $(COMPOSE_ARGS) down

restart: stop start
