.PHONY: dev build test lint clean docker-up docker-down migrate seed

# Install dependencies
install:
	npm install

# Start all services with Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

# Run Prisma migrations
migrate:
	cd apps/backend && npx prisma migrate dev

# Seed the database
seed:
	cd apps/backend && npx tsx prisma/seed.ts

# Generate Prisma client
generate:
	cd apps/backend && npx prisma generate

# Full DB setup
db-setup: migrate seed
	@echo "Database ready!"

# Start development server
dev:
	cd apps/backend && npx tsx --watch src/server.ts

# Build for production
build:
	cd apps/backend && npx tsc -p tsconfig.json

# Build admin panel
build-admin:
	cd apps/admin-panel && npx next build

# Run all tests
test:
	cd apps/backend && npx vitest run

# Run tests with coverage
test-coverage:
	cd apps/backend && npx vitest run --coverage

# Lint
lint:
	npx tsc --noEmit -p apps/backend/tsconfig.json

# Clean build artifacts
clean:
	rm -rf apps/backend/dist apps/admin-panel/.next

# Production start with PM2
prod-start:
	pm2 start ecosystem.config.cjs --env production

prod-stop:
	pm2 stop house-help-api

prod-logs:
	pm2 logs house-help-api

# Health check
health:
	curl -s http://localhost:4000/health/live | python3 -m json.tool
