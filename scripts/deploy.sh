#!/bin/bash

# Deploy Prisma migrations to production

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/deploy.sh DATABASE_URL"
    echo "Example: ./scripts/deploy.sh 'postgresql://postgres:pass@host:5432/db'"
    exit 1
fi

echo "Deploying migrations..."
DATABASE_URL="$1" npx prisma migrate deploy

echo "✅ Done!"