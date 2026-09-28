# AWS

Use ECS Fargate behind an ALB in `ap-south-1`, private RDS PostgreSQL, ElastiCache Redis with TLS, S3 with Block Public Access, Secrets Manager, CloudWatch alarms and AWS Backup. Run migrations as a one-off ECS task before updating the service. Minimum alarms: 5xx, latency, task restarts, DB connections/storage, Redis memory, payment webhook failures and outbox backlog.
