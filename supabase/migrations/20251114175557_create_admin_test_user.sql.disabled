-- Create admin test user with email/password authentication
-- Username: admin@nrghax.com
-- Password: AdminPass123!

-- First, ensure the admin email is in the admin_emails table
INSERT INTO public.admin_emails (email) VALUES ('admin@nrghax.com')
ON CONFLICT (email) DO NOTHING;

-- Add a secondary admin for testing with simpler credentials
-- Username: admin@test.com
-- Password: Test123!
INSERT INTO public.admin_emails (email) VALUES ('admin@test.com')
ON CONFLICT (email) DO NOTHING;

-- Create admin users using Supabase's auth functions
-- This approach is safer and uses the proper auth methods
DO $$
DECLARE
  admin_user_id uuid;
  test_user_id uuid;
BEGIN
  -- Check if admin@nrghax.com exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@nrghax.com';

  IF admin_user_id IS NULL THEN
    -- Create admin@nrghax.com user
    INSERT INTO auth.users (
      id,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      reauthentication_token,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_sso_user,
      role
    ) VALUES (
      gen_random_uuid(),
      'authenticated',
      'admin@nrghax.com',
      crypt('AdminPass123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      now(),
      now(),
      jsonb_build_object('name', 'Admin User'),
      false,
      'authenticated'
    )
    RETURNING id INTO admin_user_id;

    RAISE NOTICE 'Admin user created with email: admin@nrghax.com';
  ELSE
    RAISE NOTICE 'Admin user already exists: admin@nrghax.com';
  END IF;

  -- Check if admin@test.com exists
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'admin@test.com';

  IF test_user_id IS NULL THEN
    -- Create admin@test.com user
    INSERT INTO auth.users (
      id,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      reauthentication_token,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_sso_user,
      role
    ) VALUES (
      gen_random_uuid(),
      'authenticated',
      'admin@test.com',
      crypt('Test123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      now(),
      now(),
      jsonb_build_object('name', 'Test Admin'),
      false,
      'authenticated'
    )
    RETURNING id INTO test_user_id;

    RAISE NOTICE 'Test admin user created with email: admin@test.com';
  ELSE
    RAISE NOTICE 'Test admin user already exists: admin@test.com';
  END IF;
END $$;

-- Create identity records for email provider
DO $$
DECLARE
  admin_user_id uuid;
  test_user_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@nrghax.com';
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'admin@test.com';

  -- Create identity for admin@nrghax.com if it doesn't exist
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_user_id,
      jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@nrghax.com'),
      'email',
      admin_user_id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END IF;

  -- Create identity for admin@test.com if it doesn't exist
  IF test_user_id IS NOT NULL THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      test_user_id,
      jsonb_build_object('sub', test_user_id::text, 'email', 'admin@test.com'),
      'email',
      test_user_id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END IF;
END $$;