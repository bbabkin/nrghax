-- ⚠️ WARNING: This will DELETE ALL DATA in your database
-- Only run this if you're sure you want to reset everything

-- Drop all tables in the correct order (handles dependencies)
DROP TABLE IF EXISTS public.onboarding_responses CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.tag_sync_log CASCADE;
DROP TABLE IF EXISTS public.user_tags CASCADE;
DROP TABLE IF EXISTS public.hack_tags CASCADE;
DROP TABLE IF EXISTS public.hack_prerequisites CASCADE;
DROP TABLE IF EXISTS public.user_hack_completions CASCADE;
DROP TABLE IF EXISTS public.user_hack_likes CASCADE;
DROP TABLE IF EXISTS public.hacks CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any other old tables you might have
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.tag_type CASCADE;
DROP TYPE IF EXISTS public.tag_source CASCADE;

-- Drop any old functions or triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_set_admin() CASCADE;
-- Note: Cannot drop triggers on auth.users (owned by Supabase)
-- These will be handled by the setup script

-- Now you have a clean slate
SELECT 'Database wiped successfully. Ready for fresh migration.' as status;