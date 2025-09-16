# Production Database Reset Instructions

## Step 1: Wipe Everything
Go to: https://supabase.com/dashboard/project/iwvfegsrtgpqkctxvzqk/sql/new

Run this SQL to completely wipe the database:

```sql
-- WIPE EVERYTHING
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

DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_first_user CASCADE;
DROP FUNCTION IF EXISTS public.set_admin_for_first_user CASCADE;
DROP FUNCTION IF EXISTS public.get_hack_image_url CASCADE;

DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'hack-images');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'hack-images');
```

## Step 2: Apply Clean Schema
After wiping, run the migration from the terminal:

```bash
npx supabase db push --linked
```

This will apply the single clean migration: `20250116_initial_schema.sql`

## Step 3: Create Storage Buckets
Go back to SQL editor and run:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('hack-images', 'hack-images', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

-- Set storage policies
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
  );

CREATE POLICY "Authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );
```

## Step 4: Create Admin User (Optional)
If you want a test admin in production:

```sql
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_id,
    'authenticated', 'authenticated', 'admin@example.com',
    crypt('admin123', gen_salt('bf')), now(), now(), now()
  );

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (admin_id, 'admin@example.com', 'Admin User', true);
END $$;
```

## Result
You'll have a clean production database with:
- All tables from the Drizzle schema
- Proper RLS policies
- Storage buckets configured
- No legacy columns or conflicting schemas