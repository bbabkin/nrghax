-- Check RLS policies on profiles table

-- 1. Check if RLS is enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'profiles';

-- 2. List all policies on profiles table
SELECT
    polname as policy_name,
    polcmd as command,
    polpermissive as permissive,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass;

-- 3. Test if current user can read their own profile
-- This simulates what the middleware is trying to do
SELECT
    'Can read own profile?' as test,
    id,
    email,
    is_admin
FROM public.profiles
WHERE id = auth.uid();

-- 4. If the above returns nothing, fix with this policy:
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- CREATE POLICY "Users can view own profile" ON public.profiles
--     FOR SELECT
--     USING (auth.uid() = id);

-- 5. Alternative: Create a more permissive policy for testing
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
--     FOR SELECT
--     USING (true);

-- 6. Nuclear option: Disable RLS temporarily (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;