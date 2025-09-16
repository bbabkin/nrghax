-- TEMPORARY: Disable RLS to test if that's the issue
-- WARNING: Only use for debugging!

-- Disable RLS on profiles table temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Now try the admin fix
UPDATE public.profiles
SET is_admin = true
WHERE email = 'bbabkin@gmail.com';

-- Check it worked
SELECT id, email, is_admin FROM public.profiles WHERE email = 'bbabkin@gmail.com';

-- IMPORTANT: Re-enable RLS after testing!
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;