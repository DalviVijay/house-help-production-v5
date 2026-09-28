# Operations runbook

- **API unhealthy:** check `/health/ready`, recent deploy, DB saturation and Redis connectivity; roll back the image before attempting data changes.
- **Payment webhook backlog:** stop manual status edits, inspect signature failures and gateway dashboard, replay signed events only after idempotency verification.
- **Notification backlog:** inspect `OutboxMessage` by status/attempts, fix provider credentials, then release pending rows in controlled batches.
- **Tracking incident:** disable location ingestion, preserve audit logs, expire active sessions and follow the privacy incident process.
- **Rollback:** redeploy the prior immutable image. Database rollback requires a tested forward-fix or approved restore; never run destructive migration rollback casually.
