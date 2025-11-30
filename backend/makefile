.PHONY: up up-logs up-build up-build-logs dev-up-build-logs down destroy project-update-restart project-update

up:
	docker compose up -d

up-logs:
	docker compose up

up-build:
	docker compose up --build -d 

up-build-logs:
	docker compose up --build

dev-up-build-logs:
	docker compose -f docker-compose.dev.yml up --build

down:
	docker compose down

destroy:
	rm -rf pgdata redisdata redis_limiter_data && docker compose down -v

project-update:
	git pull

project-update-restart:
	make project-update
	sudo make destroy
	sudo make up-build
