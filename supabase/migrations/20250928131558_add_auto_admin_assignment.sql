-- Create a table to store admin email addresses
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default admin emails
INSERT INTO admin_emails (email) VALUES
  ('bbabkin@gmail.com'),
  ('boris@practiceenergy.com'),
  ('admin@test.com') -- Keep for testing
ON CONFLICT (email) DO NOTHING;

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced function to handle new user creation with auto-admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if the email is in the admin_emails table
  SELECT EXISTS(
    SELECT 1 FROM admin_emails
    WHERE LOWER(email) = LOWER(NEW.email)
  ) INTO is_admin_email;

  -- Insert profile with admin status based on email
  INSERT INTO public.profiles (id, email, name, is_admin, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    is_admin_email,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to set admin status based on admin_emails table
UPDATE profiles
SET is_admin = TRUE
WHERE LOWER(email) IN (
  SELECT LOWER(email) FROM admin_emails
) AND is_admin = FALSE;

-- Create a function to add/remove admin emails dynamically
CREATE OR REPLACE FUNCTION public.add_admin_email(email_address TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_emails (email) VALUES (LOWER(email_address))
  ON CONFLICT (email) DO NOTHING;

  -- Update the user's profile if they already exist
  UPDATE profiles
  SET is_admin = TRUE
  WHERE LOWER(email) = LOWER(email_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_admin_email(email_address TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM admin_emails WHERE LOWER(email) = LOWER(email_address);

  -- Update the user's profile if they exist
  UPDATE profiles
  SET is_admin = FALSE
  WHERE LOWER(email) = LOWER(email_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the admin_emails table
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify the admin emails list
CREATE POLICY "Admins can view admin emails"
  ON admin_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage admin emails"
  ON admin_emails FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add a comment explaining the auto-admin feature
COMMENT ON TABLE admin_emails IS 'Stores email addresses that should automatically be granted admin privileges upon user creation';