-- Script to add Auth.js required tables to production database
-- Run this in Supabase SQL Editor

-- Step 1: Create accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_provider_account_id_key"
ON "accounts"("provider", "provider_account_id");

-- Add foreign key to users table
ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_session_token_key"
ON "sessions"("session_token");

-- Add foreign key to users table
ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Create verification_tokens table for magic links
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key"
ON "verification_tokens"("token");

-- Create unique constraint on identifier + token
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key"
ON "verification_tokens"("identifier", "token");

-- Step 4: Add hashedPassword column to users table if it doesn't exist
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "hashed_password" TEXT;

-- Step 5: Verify all tables were created
SELECT
    'users' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
    ) as exists
UNION ALL
SELECT
    'accounts' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'accounts'
    ) as exists
UNION ALL
SELECT
    'sessions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
    ) as exists
UNION ALL
SELECT
    'verification_tokens' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'verification_tokens'
    ) as exists;

-- Step 6: Show column info for verification
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
ORDER BY table_name, ordinal_position;