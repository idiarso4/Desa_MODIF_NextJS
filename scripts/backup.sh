#!/bin/bash

# OpenSID Database Backup Script
# Automated backup script for PostgreSQL database

set -e

# Configuration
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-opensid_prod}
POSTGRES_USER=${POSTGRES_USER:-opensid}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/opensid_backup_$TIMESTAMP.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo "Starting backup at $(date)"
echo "Backup file: $BACKUP_FILE_COMPRESSED"

# Create database backup
echo "Creating database backup..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    > "$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE_COMPRESSED" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
    echo "Backup completed successfully: $BACKUP_FILE_COMPRESSED ($BACKUP_SIZE)"
else
    echo "ERROR: Backup file not created!"
    exit 1
fi

# Create backup metadata
cat > "$BACKUP_DIR/backup_$TIMESTAMP.info" << EOF
Backup Information
==================
Date: $(date)
Database: $POSTGRES_DB
Host: $POSTGRES_HOST
User: $POSTGRES_USER
File: $(basename "$BACKUP_FILE_COMPRESSED")
Size: $BACKUP_SIZE
EOF

# Clean up old backups
echo "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "opensid_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_*.info" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
echo "Recent backups:"
ls -lah "$BACKUP_DIR"/opensid_backup_*.sql.gz | tail -5

echo "Backup completed at $(date)"

# Optional: Send notification (uncomment if needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"OpenSID backup completed: '"$BACKUP_FILE_COMPRESSED"'"}' \
#     "$SLACK_WEBHOOK_URL"
