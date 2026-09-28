#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?required}" "${BACKUP_FILE:?required}"
sha256sum -c "${BACKUP_FILE}.sha256"
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$DATABASE_URL" "$BACKUP_FILE"
