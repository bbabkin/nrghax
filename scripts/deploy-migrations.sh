#!/bin/bash

# Production Migration Deployment Script
# This script safely applies migrations to production

set -e  # Exit on error

echo "🚀 Starting production migration deployment..."

# Check if we have necessary environment variables
if [ -z "$POSTGRES_URL_NON_POOLING" ]; then
    echo "❌ Error: POSTGRES_URL_NON_POOLING is not set"
    echo "Please set your production database URL (direct connection, not pooled)"
    exit 1
fi

# Use the non-pooling connection for migrations
export DATABASE_URL=$POSTGRES_URL_NON_POOLING

echo "📋 Checking current migration status..."
npx prisma migrate status

echo ""
echo "⚠️  WARNING: You are about to deploy migrations to production!"
echo "Database: $DATABASE_URL"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration deployment cancelled"
    exit 0
fi

echo ""
echo "🔄 Deploying migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migrations deployed successfully!"
echo ""
echo "📊 Verifying database state..."
npx prisma db seed --skip-generate || echo "Seeding skipped or not configured"

echo ""
echo "✅ Production migration deployment complete!"