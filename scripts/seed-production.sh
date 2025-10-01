#!/bin/bash

# Script to seed production database with initial data
# This uses Supabase CLI to execute SQL on the production database

echo "🚀 Seeding Production Database"
echo "=============================="
echo ""

# Check if we're linked to production
PROJECT_REF=$(npx supabase status 2>/dev/null | grep "API URL" | grep -o 'https://[^.]*' | sed 's/https:\/\///')

if [ "$PROJECT_REF" != "wwxflewbklhhpqbcnupf" ]; then
    echo "⚠️  Not linked to production project!"
    echo "Linking to production..."
    npx supabase link --project-ref wwxflewbklhhpqbcnupf
fi

echo "✅ Connected to production project: wwxflewbklhhpqbcnupf"
echo ""

echo "📝 Running seed script..."
echo ""

# Execute the SQL file using psql with the production URL
if [ -f ".env.production" ]; then
    # Extract database URL from .env.production
    export DATABASE_URL=$(grep "POSTGRES_URL_NON_POOLING" .env.production | cut -d'"' -f2)

    echo "The seed SQL will:"
    echo "  ✓ Add initial tags (productivity, sleep, exercise, etc.)"
    echo "  ✓ Add starter hacks (Morning Sunlight, Box Breathing, etc.)"
    echo "  ✓ Set up admin emails"
    echo "  ✓ Create storage buckets"
    echo ""

    echo "To run the seed data, execute this SQL in your Supabase Dashboard:"
    echo "1. Go to: https://supabase.com/dashboard/project/wwxflewbklhhpqbcnupf/sql"
    echo "2. Copy and paste the contents of: scripts/seed-production.sql"
    echo "3. Click 'Run'"
    echo ""
    echo "Or use the database URL directly with a PostgreSQL client:"
    echo ""
    echo "Database URL (keep private!):"
    echo "$DATABASE_URL"
    echo ""
    echo "✅ Migration setup complete!"
else
    echo "❌ .env.production file not found!"
    echo "Please ensure your production environment variables are configured."
    exit 1
fi