-- Fix ambiguous column references in helper functions

-- Drop policies that depend on the functions
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.user_profiles;
DROP POLICY IF EXISTS "Only super admins can delete profiles" ON public.user_profiles;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;

-- Helper function to check if a user is admin or super_admin (fixed parameter name)
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = target_user_id AND user_profiles.role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user is super_admin (fixed parameter name)
CREATE OR REPLACE FUNCTION public.is_super_admin(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = target_user_id AND user_profiles.role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the RLS policies with fixed function calls
-- Policy 1: Users can view their own profile OR admins can view all profiles
CREATE POLICY "Users can view own profile or admins can view all"
ON public.user_profiles FOR SELECT
USING (
  auth.uid() = id OR public.is_admin()
);

-- Policy 3: Users can update their own profile (excluding role changes) OR admins can update all
CREATE POLICY "Users can update own profile or admins can update all"
ON public.user_profiles FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin()
)
WITH CHECK (
  -- Users can only update their own profile and cannot change their role
  (auth.uid() = id AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())) OR
  -- Admins can update any profile, but only super_admins can change admin roles
  (public.is_admin() AND (
    role NOT IN ('admin', 'super_admin') OR public.is_super_admin()
  ))
);

-- Policy 4: Only super_admins can delete profiles
CREATE POLICY "Only super admins can delete profiles"
ON public.user_profiles FOR DELETE
USING (public.is_super_admin());

-- Comments for documentation
COMMENT ON FUNCTION public.is_admin IS 'Returns true if the user has admin or super_admin role';
COMMENT ON FUNCTION public.is_super_admin IS 'Returns true if the user has super_admin role';