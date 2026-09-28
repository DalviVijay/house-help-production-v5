# Backup and restore

Take daily encrypted PostgreSQL backups with 30-day retention and enable managed PITR. Test restore monthly in an isolated account. Record backup object, checksum, start/end time, row-count checks and approver. The included scripts require `pg_dump`, `pg_restore`, AWS CLI, `DATABASE_URL`, and `BACKUP_S3_BUCKET`. Never restore over production without incident approval and a maintenance window.
