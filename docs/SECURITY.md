# Security controls

- Short-lived access tokens; opaque hashed rotating refresh tokens; global revocation after password reset.
- Argon2 passwords, OTP rate limits, generic reset responses and strict request schemas.
- Helmet, explicit CORS origins, request IDs, structured logs with secret redaction and generic 500 responses.
- Raw-body payment webhook verification, timing-safe signatures, backend amount checks and idempotent events.
- AES-256-GCM payout encryption and private, limited, expiring file uploads.
- RBAC, ownership checks, audited administrative changes and consent-gated tracking.
- Idempotency persistence is supplied for critical writes and must be attached to every externally retryable mutation during final route review.

Report vulnerabilities privately. Never include credentials, customer documents or production data in reports.
