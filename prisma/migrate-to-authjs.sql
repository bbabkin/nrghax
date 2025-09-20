-- Step 1: Create new Auth.js tables

-- Create users table (renamed from profiles)
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "email_verified" TIMESTAMP,
  "name" TEXT,
  "image" TEXT,
  "is_admin" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Create accounts table for OAuth
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_provider_account_id_key"
ON "accounts"("provider", "provider_account_id");

-- Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT NOT NULL,
  "session_token" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_session_token_key" ON "sessions"("session_token");

-- Create verification tokens table
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key"
ON "verification_tokens"("identifier", "token");

-- Step 2: Migrate data from profiles to users
INSERT INTO "users" (id, email, name, image, is_admin, created_at, updated_at)
SELECT
  id::text,
  email,
  full_name as name,
  avatar_url as image,
  is_admin,
  created_at,
  updated_at
FROM profiles
ON CONFLICT (email) DO NOTHING;

-- Step 3: Update foreign key references
-- First, alter the user_hacks table to use string IDs
ALTER TABLE user_hacks ALTER COLUMN user_id TYPE TEXT;

-- Update user_tags table
ALTER TABLE user_tags ALTER COLUMN user_id TYPE TEXT;

-- Update hacks table creator references
ALTER TABLE hacks ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE hacks ALTER COLUMN updated_by TYPE TEXT;

-- Step 4: Add foreign key constraints for Auth.js tables
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Step 5: Update foreign key constraints for existing tables
ALTER TABLE user_hacks DROP CONSTRAINT IF EXISTS user_hacks_user_id_fkey;
ALTER TABLE user_hacks ADD CONSTRAINT user_hacks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_tags DROP CONSTRAINT IF EXISTS user_tags_user_id_fkey;
ALTER TABLE user_tags ADD CONSTRAINT user_tags_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE hacks DROP CONSTRAINT IF EXISTS hacks_created_by_fkey;
ALTER TABLE hacks ADD CONSTRAINT hacks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id);

-- Step 6: Drop the old profiles table (after verifying migration)
-- DROP TABLE IF EXISTS profiles CASCADE;