#!/bin/bash

# Deploy OAuth Fix to Production
# This script applies the admin_emails schema fix to production

echo "🚀 Deploying OAuth Fix to Production"
echo "===================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if we're linked to a project
PROJECT_ID=$(npx supabase status 2>/dev/null | grep "API URL" | grep -o 'https://[^.]*' | sed 's/https:\/\///')

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  No Supabase project linked."
    echo ""
    echo "Please run: npx supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "You can find your project ref in the Supabase dashboard URL:"
    echo "https://app.supabase.com/project/YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Linked to project: $PROJECT_ID"
echo ""

# Show what will be deployed
echo "📋 Migration to deploy:"
echo "  - 20250928131559_fix_admin_emails_schema.sql"
echo ""
echo "This migration fixes the Google OAuth issue by:"
echo "  ✓ Adding schema prefixes to admin_emails table references"
echo "  ✓ Fixing the handle_new_user() trigger function"
echo "  ✓ Updating admin email management functions"
echo ""

# Confirm deployment
read -p "Deploy to production? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔄 Deploying migration..."

# Deploy the migration
if npx supabase db push; then
    echo ""
    echo "✅ Migration deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Test Google OAuth on your production site"
    echo "  2. Clear browser cache if needed"
    echo "  3. Verify users can sign up with Google"
    echo ""
    echo "🔍 To verify in Supabase Dashboard:"
    echo "  1. Go to SQL Editor"
    echo "  2. Run: SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';"
    echo "  3. Verify it contains 'public.admin_emails'"
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Please check:"
    echo "  1. Your Supabase credentials"
    echo "  2. Network connection"
    echo "  3. Migration syntax"
    echo ""
    echo "You can also deploy manually via Supabase Dashboard SQL Editor"
    exit 1
fi