-- Create test admin user
-- Email: test@test.com  
-- Password: test123

DO $$
DECLARE
  user_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Insert user using Supabase's crypt function
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated', 
    'test@test.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create identity
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    id
  ) VALUES (
    user_id::text,
    user_id,
    jsonb_build_object(
      'sub', user_id::text,
      'email', 'test@test.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now(),
    gen_random_uuid()
  );

  -- Wait for trigger to create profile
  PERFORM pg_sleep(0.5);
  
  -- Make sure profile is admin
  UPDATE public.profiles 
  SET is_admin = true
  WHERE id = user_id;

  RAISE NOTICE 'Admin user created: test@test.com / test123';
END $$;