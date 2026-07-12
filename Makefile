DOCKER := $(shell which docker)
COMPOSE := $(DOCKER) compose
WITH_DOCKER ?= 1

ifeq ($(wildcard docker-compose.override.yml),)
	COMPOSE += -f docker-compose.yml
else
	COMPOSE += -f docker-compose.yml -f docker-compose.override.yml
endif

API=$(COMPOSE) exec backend
FRONT_APP=$(COMPOSE) exec frontend-app
FRONT_LANDING=$(COMPOSE) exec frontend-landing
PHP_FIXER=$(API) sh -c 'PHP_CS_FIXER_IGNORE_ENV=1 vendor/bin/php-cs-fixer fix --config=.php-cs-fixer.php'
CONSOLE := $(API) bin/console

.PHONY: help start up stop install perm php-lint php-lint-dry symfony-lint phpstan tests phpunit db drop-db fixtures

############################## HELPING ##############################

help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nAll commands available in the Makefile\n \nUsage:\n  make \033[36m<target>\033[0m\n"} /^[.a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

############################## BOOT #################################

start: up db fixtures

up:
	$(COMPOSE) up --build -d

stop:
	$(COMPOSE) stop

############################## LINTING ##############################

php-lint:
	$(PHP_FIXER)

php-lint-dry:
	$(PHP_FIXER) --dry-run

symfony-lint:
	$(CONSOLE) lint:container

lint: php-lint symfony-lint

############################## TEST #################################

tests: phpstan phpunit

phpunit:
	$(CONSOLE) doctrine:database:drop --env=test --force --if-exists
	$(CONSOLE) doctrine:database:create --env=test
	$(CONSOLE) doctrine:migrations:migrate --env=test --no-interaction
	$(API) php bin/phpunit

phpstan:
	$(API) vendor/bin/phpstan --memory-limit=-1

############################## DATABASE #############################

db:
	$(CONSOLE) doctrine:database:create --if-not-exists
	$(CONSOLE) doctrine:migrations:migrate --no-interaction

drop-db:
	$(CONSOLE) doctrine:database:drop --force --if-exists

fixtures:
	$(CONSOLE) doctrine:fixtures:load --no-interaction

reset-db: drop-db db fixtures
