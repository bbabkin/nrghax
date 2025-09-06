-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create function to check if user is the first user
CREATE OR REPLACE FUNCTION is_first_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_id = (
    SELECT id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing first user to be admin
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Create trigger function to set admin for first user
CREATE OR REPLACE FUNCTION set_admin_for_first_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id != NEW.id
  ) THEN
    NEW.is_admin := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profile inserts
DROP TRIGGER IF EXISTS set_admin_on_profile_insert ON profiles;
CREATE TRIGGER set_admin_on_profile_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_for_first_user();

-- Update RLS policies for profiles table
-- Drop existing policy for public viewing and replace with more specific ones
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create new policies for viewing profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);