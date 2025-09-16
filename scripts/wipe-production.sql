-- WIPE PRODUCTION DATABASE COMPLETELY
-- This will remove ALL tables, functions, policies, and types

-- Drop all tables (with CASCADE to handle dependencies)
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

-- Drop all custom types
DROP TYPE IF EXISTS public.tag_source CASCADE;
DROP TYPE IF EXISTS public.tag_type CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_first_user CASCADE;
DROP FUNCTION IF EXISTS public.set_admin_for_first_user CASCADE;
DROP FUNCTION IF EXISTS public.get_hack_image_url CASCADE;

-- Clear storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'hack-images');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'hack-images');

-- Clear migration history to start fresh
TRUNCATE TABLE IF EXISTS supabase_migrations.schema_migrations;

-- Verify cleanup
SELECT 'Tables remaining: ' || COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';