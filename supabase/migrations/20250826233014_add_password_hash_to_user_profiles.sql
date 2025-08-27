-- Add password_hash column to user_profiles table for email/password authentication
ALTER TABLE user_profiles 
ADD COLUMN password_hash TEXT;

-- Add columns for password reset functionality
ALTER TABLE user_profiles 
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expires_at TIMESTAMPTZ;

-- Add columns for email verification
ALTER TABLE user_profiles
ADD COLUMN email_verified BOOLEAN DEFAULT false,
ADD COLUMN verification_token TEXT,
ADD COLUMN verification_token_expires_at TIMESTAMPTZ;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update RLS policies to handle password authentication
-- Policy for users to read their own profile (including password operations)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id::uuid OR auth.role() = 'service_role');

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id::uuid OR auth.role() = 'service_role');

-- Policy for creating new user profiles (needed for registration)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id::uuid OR auth.role() = 'service_role');

-- Add unique constraint on email if not exists
ALTER TABLE user_profiles 
ADD CONSTRAINT unique_user_profiles_email UNIQUE (email);

-- Create function to handle user registration with password
CREATE OR REPLACE FUNCTION register_user_with_password(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    result JSON;
BEGIN
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert the user profile with hashed password
    INSERT INTO user_profiles (id, email, name, password_hash, created_at, updated_at)
    VALUES (
        user_id,
        lower(user_email),
        user_name,
        user_password, -- Password should already be hashed by the application
        NOW(),
        NOW()
    );
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'user_id', user_id,
        'email', user_email,
        'name', user_name
    );
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'error', 'Email already exists');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;