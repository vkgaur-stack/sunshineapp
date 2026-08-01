#!/bin/bash
# Simple timestamped MySQL backup script for cron use.
#
# Usage: ./backup-mysql.sh
# Reads connection details from environment variables (set these in cron
# itself, or source your .env before calling this script) so no
# credentials are hardcoded here.
#
# Example crontab entry (daily at 2 AM, keeps last 14 days):
#   0 2 * * * /home/yourcpaneluser/sunshine-portal/backend/scripts/backup-mysql.sh >> /home/yourcpaneluser/backup.log 2>&1

set -euo pipefail

: "${DB_HOST:=localhost}"
: "${DB_NAME:?DB_NAME environment variable is required}"
: "${DB_USER:?DB_USER environment variable is required}"
: "${DB_PASSWORD:?DB_PASSWORD environment variable is required}"
: "${BACKUP_DIR:=$HOME/sunshine-backups}"
: "${RETENTION_DAYS:=14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
OUTPUT_FILE="$BACKUP_DIR/sunshine-db-$TIMESTAMP.sql.gz"

echo "Backing up $DB_NAME to $OUTPUT_FILE ..."
mysqldump --host="$DB_HOST" --user="$DB_USER" --password="$DB_PASSWORD" \
  --single-transaction --quick --routines "$DB_NAME" | gzip > "$OUTPUT_FILE"

echo "Backup complete: $(du -h "$OUTPUT_FILE" | cut -f1)"

# Delete backups older than RETENTION_DAYS.
find "$BACKUP_DIR" -name "sunshine-db-*.sql.gz" -mtime "+$RETENTION_DAYS" -delete
echo "Old backups older than $RETENTION_DAYS days removed."
