#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/m360/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/m360_${TIMESTAMP}.sql.gz"

DB_USER="${DB_USER:-m360}"
DB_NAME="${DB_NAME:-m360}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/m360/repo/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-/opt/m360/.env}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
  exec -T postgres pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${FILESIZE})"

echo "[$(date)] Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "m360_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "m360_*.sql.gz" | wc -l)
echo "[$(date)] Backup complete. ${BACKUP_COUNT} backups retained."
