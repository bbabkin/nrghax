-- =====================================================
-- PRODUCTION DATABASE SETUP - RUN AFTER RESET
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iwvfegsrtgpqkctxvzqk/sql/new
-- =====================================================

-- Create profiles table first (needed before migrations)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create the auto-create profile function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if this is the first user (make them admin)
  DECLARE
    user_count INT;
  BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users WHERE id != NEW.id;

    INSERT INTO public.profiles (id, email, full_name, is_admin)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      user_count = 0  -- First user becomes admin
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('hack-images', 'hack-images', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'hack-images'));

CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );

-- Report completion
SELECT 'Production database setup complete!' as status;