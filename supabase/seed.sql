-- Seed data for local development and testing
-- This file is automatically run after database reset

-- Insert test users for development
-- NOTE: These are for local development only and should never be used in production

-- Test user 1: Email/password user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
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
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Test user 2: Another email/password user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
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
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'john.doe@example.com',
    crypt('securepass456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "John Doe", "full_name": "John Doe"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Insert corresponding user profiles
-- Note: These will be automatically created by the trigger, but we can insert them manually for testing

INSERT INTO public.user_profiles (id, email, name, created_at, updated_at)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'test@example.com',
        'Test User',
        NOW(),
        NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'john.doe@example.com',
        'John Doe',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- Insert test identities for auth.users
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES 
    (
        'test@example.com',
        '11111111-1111-1111-1111-111111111111',
        '{"sub": "11111111-1111-1111-1111-111111111111", "email": "test@example.com"}',
        'email',
        NOW(),
        NOW(),
        NOW()
    ),
    (
        'john.doe@example.com',
        '22222222-2222-2222-2222-222222222222',
        '{"sub": "22222222-2222-2222-2222-222222222222", "email": "john.doe@example.com"}',
        'email',
        NOW(),
        NOW(),
        NOW()
    );

-- Seed data completed successfully for local development
-- Users can now log in with:
-- Email: test@example.com, Password: password123
-- Email: john.doe@example.com, Password: securepass456