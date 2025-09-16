-- This script ensures profiles are created for existing auth users
-- Run this AFTER running PRODUCTION_SETUP.sql if profiles are still missing

-- Create profiles for any auth.users that don't have one
INSERT INTO public.profiles (id, email, created_at, updated_at, is_admin)
SELECT
    auth.users.id,
    auth.users.email,
    auth.users.created_at,
    auth.users.updated_at,
    CASE
        -- Make the first user (by creation date) an admin
        WHEN auth.users.created_at = (SELECT MIN(created_at) FROM auth.users) THEN true
        -- Or make specific email admin
        WHEN auth.users.email = 'bbabkin@gmail.com' THEN true
        ELSE false
    END as is_admin
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.users.id
);

-- Verify the results
SELECT
    p.email,
    p.full_name,
    p.is_admin,
    p.created_at,
    CASE WHEN p.is_admin THEN '✅ ADMIN' ELSE '❌ Regular User' END as status
FROM public.profiles p
ORDER BY p.created_at;