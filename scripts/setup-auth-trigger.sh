#!/bin/bash

# This script sets up the auth trigger for profile creation
# Run this after setting up your Supabase project

echo "Setting up auth trigger for automatic profile creation..."

# Check if we're in local or production
if [ "$1" == "production" ]; then
  echo "⚠️  For production, run the SQL in scripts/create-auth-trigger.sql directly in Supabase Dashboard"
  echo "   1. Go to your Supabase Dashboard"
  echo "   2. Navigate to SQL Editor"
  echo "   3. Copy and paste the contents of scripts/create-auth-trigger.sql"
  echo "   4. Run the query"
  exit 0
fi

# For local development, use Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Please install it first:"
  echo "   npm install -g supabase"
  exit 1
fi

echo "Applying trigger to local Supabase..."
cat scripts/create-auth-trigger.sql | npx supabase db push --local

if [ $? -eq 0 ]; then
  echo "✅ Auth trigger successfully created!"
  echo ""
  echo "The trigger will:"
  echo "  - Automatically create profile records for new signups"
  echo "  - Handle OAuth logins (Google, GitHub, etc)"
  echo "  - Handle email/password signups"
  echo "  - Update profiles when user metadata changes"
else
  echo "❌ Failed to create auth trigger"
  exit 1
fi