# Production deployment

## Recommended launch topology
- API and Socket.IO: Render private Docker service or AWS ECS in `ap-south-1`.
- Database: managed PostgreSQL with automated backups, PITR and private networking.
- Redis: managed Redis with TLS for Socket.IO fan-out and rate limits.
- Admin: Vercel with `NEXT_PUBLIC_API_URL` pointed at the API.
- Files/invoices: private S3-compatible bucket with lifecycle rules.
- Mobile: Expo EAS production profiles, Play Console and App Store Connect.

## Release order
1. Pass CI and security scans.
2. Create a tagged production image and immutable digest.
3. Take and verify a database backup.
4. Run `prisma migrate deploy` as a one-off job.
5. Deploy API, then admin; verify `/health/ready` and metrics.
6. Run booking/payment smoke tests.
7. Promote EAS builds only after backend compatibility checks.

Never run development migrations or seeds in production. Use managed secrets, TLS, least-privilege service accounts, private databases, and separate staging/production projects.

Alternative guides: `docs/deployment/RENDER.md`, `RAILWAY.md`, `AWS.md`, `DIGITALOCEAN.md`, and `MOBILE_RELEASE.md`.
