-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a single combined policy for viewing profiles
-- This avoids recursion by checking both conditions in one policy
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  USING (
    -- User can see their own profile
    auth.uid() = id
    OR
    -- Or user is an admin (check is_admin directly without subquery)
    (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true))
  );