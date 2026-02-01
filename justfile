[private]
just:
  just -l

set dotenv-load := true
set dotenv-required := false

root := justfile_directory()
compose_file := root + "/docker/docker-compose.yml"

export EXPLORER_BUILD_CONTEXT := env_var_or_default("EXPLORER_BUILD_CONTEXT", root)
export EXPLORER_DOCKERFILE := env_var_or_default("EXPLORER_DOCKERFILE", "docker/Dockerfile")

alias i := install
[group('setup')]
install:
  npm install

alias ri := reinstall
[group('setup')]
reinstall:
  rm -rf node_modules
  just install

alias b := build
[group('build')]
build:
  npm run build

[group('build')]
lint:
  npm run lint

alias r := dev
[group('run')]
dev:
  npm run dev

[group('run')]
start:
  npm run start

[group('test')]
test:
  npm run test

[group('test')]
test-unit:
  npm run test:unit

[group('test')]
test-e2e:
  npm run test:e2e

[group('docker')]
docker-up:
  BUILD_GIT_SHA=`git -C {{root}} rev-parse --short HEAD` \
  docker compose -f {{compose_file}} up -d --build --force-recreate

[group('docker')]
docker-down:
  docker compose -f {{compose_file}} down

[group('docker')]
docker-logs:
  docker compose -f {{compose_file}} logs -f --tail=200

[group('podman')]
podman-up:
  BUILD_GIT_SHA=`git -C {{root}} rev-parse --short HEAD` \
  podman-compose -f {{compose_file}} up -d --build --force-recreate

[group('podman')]
podman-down:
  podman-compose -f {{compose_file}} down

[group('podman')]
podman-logs:
  podman-compose -f {{compose_file}} logs -f --tail=200
