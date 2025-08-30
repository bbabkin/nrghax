-- Clear existing data and seed test users for authentication testing
-- This migration clears old data and creates test users with different roles

-- Clear existing user data (as requested)
TRUNCATE TABLE public.user_profiles CASCADE;
TRUNCATE TABLE auth.users CASCADE;

-- Insert test users directly into auth.users (Supabase auth table)
-- Note: In production, users would be created through Supabase Auth API
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES 
  -- Regular user
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'regular@example.com',
    '$2a$10$8K1p/a0dHjlJ6o0WQkzU3uw2Pn1KQ9YjLQgYdQl5rXzaWt4P6K9jG', -- "password123"
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Regular User"}',
    false
  ),
  -- Admin user
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    '$2a$10$8K1p/a0dHjlJ6o0WQkzU3uw2Pn1KQ9YjLQgYdQl5rXzaWt4P6K9jG', -- "password123"
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    false
  ),
  -- Super admin user
  (
    'c0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'super_admin@example.com',
    '$2a$10$8K1p/a0dHjlJ6o0WQkzU3uw2Pn1KQ9YjLQgYdQl5rXzaWt4P6K9jG', -- "password123"
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Super Admin User"}',
    false
  );

-- Update the profile roles for our test users (trigger creates basic profiles)
UPDATE public.user_profiles SET role = 'admin' 
WHERE id = 'b0000000-0000-0000-0000-000000000002';

UPDATE public.user_profiles SET role = 'super_admin' 
WHERE id = 'c0000000-0000-0000-0000-000000000003';

-- Add a comment for documentation
COMMENT ON TABLE public.user_profiles IS 'Test users: regular@example.com (user), admin@example.com (admin), super_admin@example.com (super_admin). All passwords: password123';