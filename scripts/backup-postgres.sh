#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL must be set to the PostgreSQL connection URL}"

backup_dir="${BACKUP_DIR:-./backups}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${backup_dir}/enigma-kanban-${timestamp}.dump"

case "$retention_days" in
  ''|*[!0-9]*) echo "BACKUP_RETENTION_DAYS must be a non-negative integer" >&2; exit 1 ;;
esac

mkdir -p "$backup_dir"
umask 077

pg_dump --format=custom --no-owner --no-privileges --file="$backup_path" "$DATABASE_URL"

if ! pg_restore --list "$backup_path" >/dev/null; then
  echo "Backup verification failed: $backup_path" >&2
  exit 1
fi

find "$backup_dir" -type f -name 'enigma-kanban-*.dump' -mtime "+$retention_days" -delete
echo "Verified PostgreSQL backup: $backup_path"
