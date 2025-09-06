-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS check_first_admin_after_insert ON public.profiles;
DROP FUNCTION IF EXISTS public.check_and_set_first_admin();

-- Create a simpler version that just checks and updates
CREATE OR REPLACE FUNCTION public.check_and_set_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if is_admin is not already true
  IF NEW.is_admin IS NOT TRUE THEN
    -- Check if this is the first profile
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id != NEW.id
    ) THEN
      -- This is the first user, make them admin
      UPDATE public.profiles 
      SET is_admin = TRUE 
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs AFTER insert
CREATE TRIGGER check_first_admin_after_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_set_first_admin();