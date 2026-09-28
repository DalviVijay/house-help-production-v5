# HOUSE HELP — Phase 1

Production-oriented foundation for a Marathi-first home-services marketplace in Kopar Khairane and Navi Mumbai.

## Included
- npm workspaces monorepo with Customer and Provider Expo apps, Next.js Admin, Express API, shared design/i18n packages
- Complete Prisma domain schema and seed scaffold
- Authentication foundation: password, OTP request/verify, refresh-token rotation, logout, forgot/reset password, RBAC middleware
- Responsive bilingual design foundations, dark mode tokens, basic mobile navigation, admin dashboard shell
- Docker Compose for PostgreSQL, Redis, backend and admin
- OpenAPI starter, architecture/security decisions, Phase 1 verification script

> Current scope: a production-testable MVP integration is included. Signed store builds and live payment/SMS/push verification still require owner credentials and staging QA. See `docs/MVP_IMPLEMENTATION_REPORT_MR.md`.

## Quick start
1. Copy `.env.example` to `.env` and replace secrets.
2. Run `npm install`.
3. Run `docker compose up -d postgres redis`.
4. Run `npm run prisma:generate -w @house-help/backend`.
5. Run `npm run prisma:migrate -w @house-help/backend`.
6. Run `npm run dev -w @house-help/backend`.
7. In separate terminals, run an app: `npm run dev -w @house-help/admin`, `npm run dev -w @house-help/customer-app`, or `npm run dev -w @house-help/provider-app`.

## Verification
`npm test` performs repository-level structural/security checks without requiring dependencies. With dependencies installed, use each workspace's `typecheck`, `test`, and `build` scripts.

See `docs/PHASE_1_REPORT.md` and `docs/ARCHITECTURE.md`.
