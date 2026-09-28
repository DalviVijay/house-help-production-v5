#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?required}" "${BACKUP_S3_BUCKET:?required}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="/tmp/househelp-${STAMP}.dump"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > "$FILE"
sha256sum "$FILE" > "${FILE}.sha256"
aws s3 cp "$FILE" "s3://${BACKUP_S3_BUCKET}/postgres/${STAMP}.dump" --sse AES256
aws s3 cp "${FILE}.sha256" "s3://${BACKUP_S3_BUCKET}/postgres/${STAMP}.dump.sha256" --sse AES256
rm -f "$FILE" "${FILE}.sha256"
