.PHONY: up down migrate-up migrate-down run test

up:
	docker compose up -d

down:
	docker compose down

migrate-up:
	cd backend && go run ./cmd/migrate up

migrate-down:
	cd backend && go run ./cmd/migrate down

run:
	cd backend && go run ./cmd/server

test:
	cd backend && go test ./... -v

seed:
	cd backend && go run ./cmd/seed
