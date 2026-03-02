COMPOSE       = docker compose
COMPOSE_DEV   = $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: help up dev down build logs clean ps restart lint

help: 
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: 
	$(COMPOSE) up --build -d

dev: 
	$(COMPOSE_DEV) up --build

down: 
	$(COMPOSE) down

build: 
	$(COMPOSE) build

logs: 
	$(COMPOSE) logs -f

clean: 
	$(COMPOSE) down --rmi all --volumes --remove-orphans

ps: 
	$(COMPOSE) ps

restart: 
	$(COMPOSE) restart

lint: 
	@command -v hadolint >/dev/null 2>&1 || { echo "Install hadolint: https://github.com/hadolint/hadolint"; exit 1; }
	hadolint ai-service/Dockerfile
	hadolint gateway/Dockerfile
	hadolint frontend/Dockerfile
