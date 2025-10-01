-- Create test users for development
-- Run this in Supabase SQL Editor or via psql

-- ============================================
-- IMPORTANT: These are test users for development
-- Use simple passwords for testing only
-- ============================================

-- Create test admin user
-- Email: admin@test.com
-- Password: admin123
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@test.com';

  IF admin_user_id IS NULL THEN
    -- Create admin user using Supabase's auth.users table
    -- Note: In local development, we can insert directly
    admin_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User"}'
    );

    -- Create admin profile
    INSERT INTO public.profiles (
      id,
      email,
      name,
      username,
      is_admin,
      onboarded
    ) VALUES (
      admin_user_id,
      'admin@test.com',
      'Admin User',
      'admin',
      true,
      true
    );

    RAISE NOTICE 'Admin user created successfully';
  ELSE
    -- Update existing user to be admin
    UPDATE public.profiles
    SET is_admin = true, onboarded = true
    WHERE id = admin_user_id;

    RAISE NOTICE 'Admin user already exists, updated admin status';
  END IF;
END $$;

-- Create test regular user
-- Email: user@test.com
-- Password: user123
DO $$
DECLARE
  regular_user_id UUID;
BEGIN
  -- Check if regular user already exists
  SELECT id INTO regular_user_id
  FROM auth.users
  WHERE email = 'user@test.com';

  IF regular_user_id IS NULL THEN
    -- Create regular user
    regular_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      regular_user_id,
      '00000000-0000-0000-0000-000000000000',
      'user@test.com',
      crypt('user123', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Test User"}'
    );

    -- Create regular user profile
    INSERT INTO public.profiles (
      id,
      email,
      name,
      username,
      is_admin,
      onboarded
    ) VALUES (
      regular_user_id,
      'user@test.com',
      'Test User',
      'testuser',
      false,
      false  -- Not onboarded so they can test onboarding flow
    );

    -- Assign some default tags to the regular user
    INSERT INTO public.user_tags (user_id, tag_id, source)
    SELECT
      regular_user_id,
      id,
      'default'
    FROM public.tags
    WHERE slug IN ('beginner', 'energy')
    LIMIT 2;

    RAISE NOTICE 'Regular user created successfully';
  ELSE
    RAISE NOTICE 'Regular user already exists';
  END IF;
END $$;

-- Create another test user with partial setup
-- Email: newuser@test.com
-- Password: newuser123
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if new user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'newuser@test.com';

  IF new_user_id IS NULL THEN
    -- Create new user
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'newuser@test.com',
      crypt('newuser123', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "New User"}'
    );

    -- Create new user profile (not onboarded, no tags)
    INSERT INTO public.profiles (
      id,
      email,
      name,
      username,
      is_admin,
      onboarded
    ) VALUES (
      new_user_id,
      'newuser@test.com',
      'New User',
      'newuser',
      false,
      false  -- Will need to go through onboarding
    );

    RAISE NOTICE 'New user created successfully';
  ELSE
    RAISE NOTICE 'New user already exists';
  END IF;
END $$;

-- Display created test users
SELECT
  u.email,
  p.name,
  p.username,
  p.is_admin,
  p.onboarded,
  COUNT(ut.tag_id) as tag_count
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_tags ut ON u.id = ut.user_id
WHERE u.email IN ('admin@test.com', 'user@test.com', 'newuser@test.com')
GROUP BY u.email, p.name, p.username, p.is_admin, p.onboarded
ORDER BY p.is_admin DESC, u.email;

-- Summary
SELECT '
Test Users Created:
==================
1. Admin User
   Email: admin@test.com
   Password: admin123
   Status: Admin, Onboarded

2. Regular User
   Email: user@test.com
   Password: user123
   Status: Regular user with some tags

3. New User
   Email: newuser@test.com
   Password: newuser123
   Status: New user, needs onboarding

You can now test the different user flows!' as summary;