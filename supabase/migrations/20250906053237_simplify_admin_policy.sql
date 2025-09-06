-- Drop the existing policy that causes recursion
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create separate, non-recursive policies
-- Users can always see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admins can see all profiles (using the function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));