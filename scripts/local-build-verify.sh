#!/usr/bin/env bash
set -euo pipefail
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
[ "$NODE_MAJOR" = "22" ] || { echo 'Node.js 22 LTS is required'; exit 1; }
command -v docker >/dev/null || { echo 'Docker Desktop required'; exit 1; }
[ -f package-lock.json ] || { echo 'package-lock.json missing: run npm install once and commit it'; exit 1; }
[ -f .env ] || cp .env.example .env
cp .env apps/backend/.env
npm ci
docker compose up -d postgres redis
for i in {1..30}; do docker compose exec -T postgres pg_isready -U househelp -d househelp >/dev/null 2>&1 && break; sleep 2; done
docker compose exec -T postgres pg_isready -U househelp -d househelp
npm run prisma:generate -w @house-help/backend
[ -d apps/backend/prisma/migrations ] || { echo 'Committed Prisma migrations are required'; exit 1; }
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
npm run prisma:seed -w @house-help/backend
npm run typecheck -w @house-help/backend
npm run test -w @house-help/backend
npm run build -w @house-help/backend
npm run typecheck -w @house-help/admin
npm run build -w @house-help/admin
npm run typecheck -w @house-help/customer-app
npm run typecheck -w @house-help/provider-app
node scripts/verify.mjs
node scripts/verify-mobile-release.mjs customer-app
node scripts/verify-mobile-release.mjs provider-app
echo 'LOCAL BUILD VERIFICATION PASS'
