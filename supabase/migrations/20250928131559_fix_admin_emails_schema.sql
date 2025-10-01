-- Fix the handle_new_user function to properly reference the admin_emails table with schema prefix

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced function with proper schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if the email is in the admin_emails table (with schema prefix)
  SELECT EXISTS(
    SELECT 1 FROM public.admin_emails
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

-- Also fix the add_admin_email function
CREATE OR REPLACE FUNCTION public.add_admin_email(email_address TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_emails (email) VALUES (LOWER(email_address))
  ON CONFLICT (email) DO NOTHING;

  -- Update the user's profile if they already exist
  UPDATE public.profiles
  SET is_admin = TRUE
  WHERE LOWER(email) = LOWER(email_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_admin_email(email_address TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.admin_emails WHERE LOWER(email) = LOWER(email_address);

  -- Update the user's profile if they exist
  UPDATE public.profiles
  SET is_admin = FALSE
  WHERE LOWER(email) = LOWER(email_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;