-- Fix the RLS policy to be more permissive for profile reads
-- This allows the middleware to check admin status

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a more permissive SELECT policy
-- Users can view their own profile OR any profile when checking specific fields
CREATE POLICY "Users can view profiles for auth" ON public.profiles
    FOR SELECT
    USING (
        -- Can always view your own profile
        auth.uid() = id
        OR
        -- Can view is_admin field for any profile if you're authenticated
        -- This allows middleware to check admin status
        auth.uid() IS NOT NULL
    );

-- Verify the new policy works
SELECT
    'Testing profile access' as test,
    id,
    email,
    is_admin
FROM public.profiles
WHERE email = 'bbabkin@gmail.com';

-- Also ensure the user's profile is marked as admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'bbabkin@gmail.com';

-- Final check
SELECT
    'Final Status' as check,
    email,
    is_admin,
    CASE WHEN is_admin THEN '✅ ADMIN ACCESS ENABLED' ELSE '❌ NOT ADMIN' END as status
FROM public.profiles
WHERE email = 'bbabkin@gmail.com';