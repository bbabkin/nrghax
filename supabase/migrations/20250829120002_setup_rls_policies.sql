-- Comprehensive RLS (Row Level Security) policies for role-based access control
-- This migration sets up proper security policies for the user_profiles table

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

-- Helper function to check if a user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Users can view their own profile OR admins can view all profiles
CREATE POLICY "Users can view own profile or admins can view all"
ON public.user_profiles FOR SELECT
USING (
  auth.uid() = id OR public.is_admin()
);

-- Policy 2: Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

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

-- Grant permissions to authenticated users and service role
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Add indexes for better performance on role-based queries
CREATE INDEX IF NOT EXISTS user_profiles_role_auth_idx ON public.user_profiles(role, id);

-- Comments for documentation
COMMENT ON FUNCTION public.is_admin IS 'Returns true if the user has admin or super_admin role';
COMMENT ON FUNCTION public.is_super_admin IS 'Returns true if the user has super_admin role';