-- =====================================================
-- COMPLETE PRODUCTION DATABASE RESET
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iwvfegsrtgpqkctxvzqk/sql/new
-- =====================================================

-- Step 1: Drop all custom tables and types
DROP TABLE IF EXISTS public.hack_tags CASCADE;
DROP TABLE IF EXISTS public.user_tags CASCADE;
DROP TABLE IF EXISTS public.user_hack_likes CASCADE;
DROP TABLE IF EXISTS public.user_hack_completions CASCADE;
DROP TABLE IF EXISTS public.hack_prerequisites CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.onboarding_responses CASCADE;
DROP TABLE IF EXISTS public.tag_sync_log CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.hacks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.tag_source CASCADE;
DROP TYPE IF EXISTS public.tag_type CASCADE;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_first_user CASCADE;
DROP FUNCTION IF EXISTS public.set_admin_for_first_user CASCADE;
DROP FUNCTION IF EXISTS public.get_hack_image_url CASCADE;

-- Step 3: Clear storage
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'hack-images');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'hack-images');

-- Step 4: Clear all RLS policies on storage
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
  END LOOP;
END $$;

-- Step 5: Drop any auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Report completion
SELECT 'Database completely reset!' as status;