-- Create test helpers schema and functions (only in test/development environments)
-- These helpers are based on Supabase's testing recommendations

-- Create tests schema
CREATE SCHEMA IF NOT EXISTS tests;

-- Function to create a test user
CREATE OR REPLACE FUNCTION tests.create_supabase_user(username text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Generate a UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert user into auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        role,
        aud
    ) VALUES (
        user_id,
        username || '@test.local',
        crypt('test_password', gen_salt('bf')),
        now(),
        '{"test_user": true}'::jsonb,
        'authenticated',
        'authenticated'
    );
    
    RETURN user_id;
END;
$$;

-- Function to get a test user's UUID by username
CREATE OR REPLACE FUNCTION tests.get_supabase_uid(username text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT id FROM auth.users WHERE email = username || '@test.local' LIMIT 1;
$$;

-- Function to authenticate as a specific user
CREATE OR REPLACE FUNCTION tests.authenticate_as(username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    SELECT tests.get_supabase_uid(username) INTO user_id;
    
    -- Set the current user for RLS policies
    PERFORM set_config('request.jwt.claims', json_build_object(
        'sub', user_id::text,
        'role', 'authenticated',
        'email', username || '@test.local'
    )::text, true);
    
    -- Set the authenticated role
    PERFORM set_config('role', 'authenticated', true);
END;
$$;

-- Function to clear authentication
CREATE OR REPLACE FUNCTION tests.clear_authentication()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear JWT claims
    PERFORM set_config('request.jwt.claims', ''::text, true);
    
    -- Set role back to anon
    PERFORM set_config('role', 'anon', true);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA tests TO postgres, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO postgres, anon, authenticated;