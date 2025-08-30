-- Seed data for Supabase Auth testing with role-based access control
-- Test users with different roles for comprehensive testing

-- Clear existing data first
TRUNCATE TABLE public.user_profiles CASCADE;
TRUNCATE TABLE auth.users CASCADE;

-- Test user 1: Regular user (role: user)
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
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'regular@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Regular User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Test user 2: Admin user (role: admin)
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
    'b0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Test user 3: Super admin user (role: super_admin)
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
    'c0000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'super_admin@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Super Admin User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Insert corresponding user profiles with roles
-- The trigger will create basic profiles, then we update the roles
INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
VALUES 
    (
        'a0000000-0000-0000-0000-000000000001',
        'regular@example.com',
        'Regular User',
        'user',
        NOW(),
        NOW()
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'admin@example.com',
        'Admin User',
        'admin',
        NOW(),
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'super_admin@example.com',
        'Super Admin User',
        'super_admin',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
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
        'regular@example.com',
        'a0000000-0000-0000-0000-000000000001',
        '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "regular@example.com"}',
        'email',
        NOW(),
        NOW(),
        NOW()
    ),
    (
        'admin@example.com',
        'b0000000-0000-0000-0000-000000000002',
        '{"sub": "b0000000-0000-0000-0000-000000000002", "email": "admin@example.com"}',
        'email',
        NOW(),
        NOW(),
        NOW()
    ),
    (
        'super_admin@example.com',
        'c0000000-0000-0000-0000-000000000003',
        '{"sub": "c0000000-0000-0000-0000-000000000003", "email": "super_admin@example.com"}',
        'email',
        NOW(),
        NOW(),
        NOW()
    );

-- Seed data completed successfully for role-based testing
-- Test users can now log in with:
-- Email: regular@example.com, Password: password123 (role: user)
-- Email: admin@example.com, Password: password123 (role: admin)
-- Email: super_admin@example.com, Password: password123 (role: super_admin)