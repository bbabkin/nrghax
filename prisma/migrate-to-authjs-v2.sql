-- Migration to Auth.js from Supabase Auth
-- This migration renames profiles to users and adds Auth.js tables

-- Step 1: Rename profiles table to users
ALTER TABLE profiles RENAME TO users;

-- Step 2: Rename columns in users table
ALTER TABLE users RENAME COLUMN full_name TO name;
ALTER TABLE users RENAME COLUMN avatar_url TO image;

-- Step 3: Add email_verified column
ALTER TABLE users ADD COLUMN email_verified TIMESTAMP;

-- Step 4: Create Auth.js tables

-- Create accounts table for OAuth
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

CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key"
ON "accounts"("provider", "provider_account_id");

-- Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT NOT NULL,
  "session_token" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- Create verification tokens table
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key"
ON "verification_tokens"("identifier", "token");

-- Step 5: Add foreign key constraints for Auth.js tables
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Step 6: Update existing foreign key constraints
ALTER TABLE user_hacks DROP CONSTRAINT IF EXISTS user_hacks_user_id_fkey;
ALTER TABLE user_hacks ADD CONSTRAINT user_hacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_tags DROP CONSTRAINT IF EXISTS user_tags_user_id_fkey;
ALTER TABLE user_tags ADD CONSTRAINT user_tags_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE hacks DROP CONSTRAINT IF EXISTS hacks_created_by_fkey;
ALTER TABLE hacks ADD CONSTRAINT hacks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id);