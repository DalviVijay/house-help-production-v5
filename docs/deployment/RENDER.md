# Render

Create services from `render.yaml`, set all `sync: false` secrets, attach a custom TLS domain, run `prisma migrate deploy` from a one-off job, then enable deploy protection and health checks. Do not expose PostgreSQL or Redis publicly.
