-- Drop the problematic trigger
DROP TRIGGER IF EXISTS set_admin_on_profile_insert ON profiles;
DROP FUNCTION IF EXISTS set_admin_for_first_user();

-- Create a simpler version that works after insert
CREATE OR REPLACE FUNCTION check_and_set_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this user is not already an admin
  IF NEW.is_admin IS FALSE OR NEW.is_admin IS NULL THEN
    -- Check if there are any other users (excluding this one)
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id != NEW.id
      LIMIT 1
    ) THEN
      -- This is the first user, make them admin
      UPDATE profiles 
      SET is_admin = TRUE 
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs AFTER insert (not BEFORE)
CREATE TRIGGER check_first_admin_after_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_set_first_admin();