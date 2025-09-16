-- Minimal seed data for development and testing

-- Create test users
DO $$
DECLARE
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  user_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Admin user: test@test.com / test123
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'test@test.com', crypt('test123', gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
  ) VALUES (
    admin_id::text, admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', 'test@test.com', 'email_verified', true),
    'email', now(), now(), now(), gen_random_uuid()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Regular user: user@test.com / test123
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated',
    'user@test.com', crypt('test123', gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
  ) VALUES (
    user_id::text, user_id,
    jsonb_build_object('sub', user_id::text, 'email', 'user@test.com', 'email_verified', true),
    'email', now(), now(), now(), gen_random_uuid()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Create profiles for users
  INSERT INTO public.profiles (id, email, full_name, is_admin) VALUES
    (admin_id, 'test@test.com', 'Test Admin', true),
    (user_id, 'user@test.com', 'Test User', false)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test users created:';
  RAISE NOTICE '  Admin: test@test.com / test123';
  RAISE NOTICE '  User: user@test.com / test123';
END $$;