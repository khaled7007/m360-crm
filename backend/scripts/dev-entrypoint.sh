#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U m360 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Running migrations..."
# Apply migrations using psql
for f in /app/migrations/*.up.sql; do
  echo "Applying $f..."
  PGPASSWORD=m360 psql -h postgres -U m360 -d m360 -f "$f" 2>&1 || true
done

echo "Seeding data..."
go run ./cmd/seed

echo "Starting server with Air..."
exec air -c .air.toml
