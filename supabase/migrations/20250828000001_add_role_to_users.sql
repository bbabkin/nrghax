-- Add role column to users table for admin user management
-- This migration is idempotent and safe to run multiple times

DO $$
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- Create index on role column for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add check constraint to ensure valid roles
DO $$
BEGIN
    -- Drop constraint if it exists (for idempotency)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_role_check' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Add the constraint
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('user', 'admin', 'super_admin'));
END $$;

-- Comment on the new column
COMMENT ON COLUMN users.role IS 'User role: user (default), admin, or super_admin';