-- Debug script to check why admin isn't working
-- Run this in your Supabase SQL Editor

-- 1. Check auth.users table
SELECT
    'AUTH USERS' as table_name,
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'bbabkin@gmail.com';

-- 2. Check profiles table
SELECT
    'PROFILES' as table_name,
    id,
    email,
    is_admin,
    created_at,
    updated_at
FROM public.profiles
WHERE email = 'bbabkin@gmail.com';

-- 3. Check if profile exists for the auth user
SELECT
    'PROFILE MATCH' as check_type,
    au.id as auth_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.is_admin,
    CASE
        WHEN p.id IS NULL THEN '❌ NO PROFILE EXISTS'
        WHEN p.is_admin = true THEN '✅ IS ADMIN'
        ELSE '❌ NOT ADMIN'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'bbabkin@gmail.com';

-- 4. If no profile exists, this will fix it:
-- UNCOMMENT AND RUN THIS AFTER CHECKING ABOVE
/*
INSERT INTO public.profiles (
    id,
    email,
    is_admin,
    onboarding_completed,
    created_at,
    updated_at
)
SELECT
    id,
    email,
    true, -- Make admin
    false, -- Not completed onboarding
    created_at,
    updated_at
FROM auth.users
WHERE email = 'bbabkin@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
    is_admin = true,
    email = EXCLUDED.email,
    updated_at = now();

-- Verify the fix
SELECT * FROM public.profiles WHERE email = 'bbabkin@gmail.com';
*/