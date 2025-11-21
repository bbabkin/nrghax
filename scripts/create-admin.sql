-- Create admin users for development/testing
-- Run with: psql -h localhost -p 54322 -U postgres -d postgres -f scripts/create-admin.sql

-- Ensure admin emails are registered
INSERT INTO public.admin_emails (email) VALUES
  ('admin@nrghax.com'),
  ('admin@test.com')
ON CONFLICT (email) DO NOTHING;

-- Delete existing users to start fresh (for testing only!)
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@nrghax.com', 'admin@test.com')
);
DELETE FROM auth.users WHERE email IN ('admin@nrghax.com', 'admin@test.com');

-- Create function to add test users
CREATE OR REPLACE FUNCTION create_test_admin_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user1_id uuid;
  user2_id uuid;
BEGIN
  -- Create admin@nrghax.com
  SELECT id INTO user1_id FROM auth.users WHERE email = 'admin@nrghax.com';

  IF user1_id IS NULL THEN
    user1_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_sso_user,
      role,
      instance_id,
      aud
    ) VALUES (
      user1_id,
      'admin@nrghax.com',
      crypt('AdminPass123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"name": "Admin User"}'::jsonb,
      false,
      'authenticated',
      '00000000-0000-0000-0000-000000000000',
      'authenticated'
    );

    -- Create identity for email provider
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
      user1_id,
      jsonb_build_object(
        'sub', user1_id::text,
        'email', 'admin@nrghax.com',
        'email_verified', true
      ),
      'email',
      user1_id::text,
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Created admin@nrghax.com';
  ELSE
    -- Update password for existing user
    UPDATE auth.users
    SET encrypted_password = crypt('AdminPass123!', gen_salt('bf'))
    WHERE id = user1_id;
    RAISE NOTICE 'Updated password for admin@nrghax.com';
  END IF;

  -- Create admin@test.com
  SELECT id INTO user2_id FROM auth.users WHERE email = 'admin@test.com';

  IF user2_id IS NULL THEN
    user2_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_sso_user,
      role,
      instance_id,
      aud
    ) VALUES (
      user2_id,
      'admin@test.com',
      crypt('Test123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"name": "Test Admin"}'::jsonb,
      false,
      'authenticated',
      '00000000-0000-0000-0000-000000000000',
      'authenticated'
    );

    -- Create identity for email provider
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
      user2_id,
      jsonb_build_object(
        'sub', user2_id::text,
        'email', 'admin@test.com',
        'email_verified', true
      ),
      'email',
      user2_id::text,
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Created admin@test.com';
  ELSE
    -- Update password for existing user
    UPDATE auth.users
    SET encrypted_password = crypt('Test123!', gen_salt('bf'))
    WHERE id = user2_id;
    RAISE NOTICE 'Updated password for admin@test.com';
  END IF;
END;
$$;

-- Execute the function
SELECT create_test_admin_users();

-- Clean up
DROP FUNCTION create_test_admin_users();

-- Verify the users were created
SELECT
  u.email,
  p.is_admin,
  p.name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('admin@nrghax.com', 'admin@test.com');