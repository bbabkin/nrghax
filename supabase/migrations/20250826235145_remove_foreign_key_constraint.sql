-- Remove foreign key constraint from user_profiles table
-- This allows us to use our own UUID-based user management independent of auth.users

-- Drop the existing foreign key constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Remove the trigger and function that depends on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update RLS policies to work without auth.users dependency
-- Remove auth.uid() references since we're not using auth.users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create simpler policies that allow service_role full access
-- In production, you might want more restrictive policies based on JWT claims
CREATE POLICY "Allow service role full access" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read all profiles (adjust based on your needs)
CREATE POLICY "Allow authenticated read" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Change id column from UUID with foreign key to just UUID
-- The column type is already UUID, so no need to change that
-- Just ensure it doesn't reference auth.users anymore

-- Update the register_user_with_password function to not depend on auth.users
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