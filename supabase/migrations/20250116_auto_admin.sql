-- Function to automatically set admin status for specific emails
CREATE OR REPLACE FUNCTION check_and_set_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_emails text[] := string_to_array(
    current_setting('app.admin_emails', true),
    ','
  );
BEGIN
  -- Check if the user's email is in the admin list
  IF admin_emails IS NOT NULL AND NEW.email = ANY(admin_emails) THEN
    NEW.is_admin := true;
  END IF;

  -- Also make the first user admin if no admins exist
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE is_admin = true) THEN
    NEW.is_admin := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS on_profile_created_check_admin ON profiles;
CREATE TRIGGER on_profile_created_check_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_set_admin();

-- You can set the admin emails configuration in Supabase Dashboard
-- Go to Settings > Database > Database Settings
-- Add under "Session settings":
-- app.admin_emails = 'admin@example.com,owner@company.com'