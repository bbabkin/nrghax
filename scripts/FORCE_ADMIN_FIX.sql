-- FORCE ADMIN FIX - Run this entire script in Supabase SQL Editor

-- Step 1: Show current situation
SELECT
    '=== CURRENT SITUATION ===' as info;

SELECT
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.is_admin as is_admin_status,
    CASE
        WHEN p.id IS NULL THEN '❌ NO PROFILE'
        WHEN p.is_admin = true THEN '✅ ADMIN'
        ELSE '❌ NOT ADMIN'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'bbabkin@gmail.com';

-- Step 2: Delete any existing profile (to start fresh)
DELETE FROM public.profiles
WHERE email = 'bbabkin@gmail.com'
   OR id IN (SELECT id FROM auth.users WHERE email = 'bbabkin@gmail.com');

SELECT '=== OLD PROFILE DELETED ===' as info;

-- Step 3: Create new admin profile
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    is_admin,
    onboarding_completed,
    created_at,
    updated_at
)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    true, -- FORCE ADMIN TRUE
    true, -- Mark onboarding as complete to avoid redirect
    created_at,
    now()
FROM auth.users
WHERE email = 'bbabkin@gmail.com';

SELECT '=== NEW ADMIN PROFILE CREATED ===' as info;

-- Step 4: Verify the fix worked
SELECT
    id,
    email,
    full_name,
    is_admin,
    onboarding_completed,
    created_at,
    CASE
        WHEN is_admin = true THEN '✅✅✅ YOU ARE NOW ADMIN ✅✅✅'
        ELSE '❌ STILL NOT ADMIN - CONTACT SUPPORT'
    END as final_status
FROM public.profiles
WHERE email = 'bbabkin@gmail.com';

-- Step 5: Double-check the profile matches auth user
SELECT
    '=== FINAL VERIFICATION ===' as info;

SELECT
    au.id = p.id as ids_match,
    au.email as auth_email,
    p.email as profile_email,
    p.is_admin as is_admin,
    p.onboarding_completed
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'bbabkin@gmail.com';

-- If you see "YOU ARE NOW ADMIN" above, you're all set!
-- Sign out and sign back in to refresh your session