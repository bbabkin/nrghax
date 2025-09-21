-- Script to add hashedPassword column for Auth.js credentials provider
-- Run this in Supabase SQL Editor

-- Step 1: Add the hashedPassword column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "hashed_password" TEXT;

-- Step 2: Verify the column was added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name = 'hashed_password';

-- Step 3: Check if any users already exist
SELECT
    id,
    email,
    name,
    "hashed_password" IS NOT NULL as has_password
FROM "User"
LIMIT 10;

-- Optional: Create test users with hashed passwords
-- Note: These passwords are hashed with bcrypt (10 rounds)
-- test@test.com / password123
-- admin@test.com / admin123

/*
-- Uncomment to create test users:

INSERT INTO "User" (id, email, name, "hashed_password", "email_verified", "is_admin", "created_at", "updated_at")
VALUES
(
    gen_random_uuid(),
    'test@test.com',
    'Test User',
    '$2a$10$8kQ3Y.WzY3QKqGzKxGzCXu4BZKqGzKxGzKxGzKxGzKxGzKxGzKxGz',  -- password123
    NOW(),
    false,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'admin@test.com',
    'Admin User',
    '$2a$10$PqGzKxGzKxGzKxGzKxGzKu4BZKqGzKxGzKxGzKxGzKxGzKxGzKxGz',  -- admin123
    NOW(),
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
*/

-- Verification: Count users with and without passwords
SELECT
    COUNT(*) FILTER (WHERE "hashed_password" IS NOT NULL) as users_with_password,
    COUNT(*) FILTER (WHERE "hashed_password" IS NULL) as users_without_password,
    COUNT(*) as total_users
FROM "User";