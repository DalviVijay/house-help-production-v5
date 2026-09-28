# Architecture

- **React Native + Expo** is the single mobile stack for both applications. Shared tokens and translations prevent drift.
- **Express modular monolith** provides clear domain boundaries now and a safe path to services later.
- **PostgreSQL + Prisma** is the source of truth. Redis is reserved for rate limits, OTP/session support and later job queues.
- **Security:** short-lived JWT access tokens; opaque, hashed, rotatable refresh tokens; Argon2id password hashes; hashed OTP challenges; RBAC; Helmet; strict validation; rate limits; generic password-reset response.
- **Privacy:** sensitive bank/UPI fields are marked encrypted; production must use envelope encryption/KMS. Identity documents must use private object storage and signed URLs.
- **Scope boundary:** Phase 1 exposes authentication and health routes. Booking/payment/location schemas anticipate later phases but no unverified workflow is presented as implemented.
