-- Comprehensive seed data for NRGhax application
-- Creates test users, hacks, tags, and relationships

-- Create test users
DO $$
DECLARE
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  user_id uuid := '22222222-2222-2222-2222-222222222222';
  john_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Admin user: test@test.com / test123
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 
    'test@test.com', crypt('test123', gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
    '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
  ) VALUES (
    admin_id::text, admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', 'test@test.com', 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now(), gen_random_uuid()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Regular user: user@test.com / test123
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', 
    'user@test.com', crypt('test123', gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
    '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
  ) VALUES (
    user_id::text, user_id,
    jsonb_build_object('sub', user_id::text, 'email', 'user@test.com', 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now(), gen_random_uuid()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Another user: john@test.com / test123
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', john_id, 'authenticated', 'authenticated', 
    'john@test.com', crypt('test123', gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
    '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
  ) VALUES (
    john_id::text, john_id,
    jsonb_build_object('sub', john_id::text, 'email', 'john@test.com', 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now(), gen_random_uuid()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Wait for trigger to create profiles
  PERFORM pg_sleep(0.5);
  
  -- Update profiles with additional info
  UPDATE public.profiles SET 
    is_admin = true,
    full_name = 'Admin User',
    discord_id = '123456789',
    discord_username = 'admin#0001',
    discord_roles = ARRAY['Admin', 'Energy Master', 'Verified']
  WHERE id = admin_id;

  UPDATE public.profiles SET 
    full_name = 'Test User',
    discord_id = '987654321',
    discord_username = 'testuser#0002',
    discord_roles = ARRAY['Beginner', 'Verified']
  WHERE id = user_id;

  UPDATE public.profiles SET 
    full_name = 'John Doe',
    discord_id = '555555555',
    discord_username = 'johndoe#0003',
    discord_roles = ARRAY['Intermediate', 'Energy Worker']
  WHERE id = john_id;

  RAISE NOTICE 'Test users created:';
  RAISE NOTICE '  Admin: test@test.com / test123';
  RAISE NOTICE '  User: user@test.com / test123';
  RAISE NOTICE '  John: john@test.com / test123';
END $$;

-- Create tags (simulating Discord roles)
INSERT INTO public.tags (id, name, slug, created_by)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Beginner', 'beginner', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Intermediate', 'intermediate', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Advanced', 'advanced', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Energy Worker', 'energy-worker', '11111111-1111-1111-1111-111111111111'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Energy Master', 'energy-master', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Verified', 'verified', '11111111-1111-1111-1111-111111111111'),
  ('11111111-2222-3333-4444-555555555555', 'Morning Person', 'morning-person', '11111111-1111-1111-1111-111111111111'),
  ('22222222-3333-4444-5555-666666666666', 'Night Owl', 'night-owl', '11111111-1111-1111-1111-111111111111'),
  ('33333333-4444-5555-6666-777777777777', 'Meditation', 'meditation', '11111111-1111-1111-1111-111111111111'),
  ('44444444-5555-6666-7777-888888888888', 'Breathwork', 'breathwork', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Create hacks
INSERT INTO public.hacks (id, name, description, image_url, content_type, content_body, external_link, created_by)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Morning Energy Boost', 'Start your day with this simple energy activation technique', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 'content', 
   E'# Morning Energy Boost\n\nThis technique helps you activate your energy centers for the day ahead.\n\n## Steps:\n1. Stand with feet shoulder-width apart\n2. Take 5 deep breaths\n3. Visualize golden light entering through your crown\n4. Feel the energy spreading through your body\n5. Set your intention for the day', 
   NULL, '11111111-1111-1111-1111-111111111111'),
   
  ('a2222222-2222-2222-2222-222222222222', 'Grounding Meditation', 'Connect with Earth energy for stability and balance', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800', 'content',
   E'# Grounding Meditation\n\nGround yourself and connect with Earth''s energy.\n\n## Technique:\n1. Sit or stand barefoot on natural ground\n2. Imagine roots growing from your feet\n3. Send any negative energy down through the roots\n4. Draw up Earth''s healing energy\n5. Feel centered and balanced',
   NULL, '11111111-1111-1111-1111-111111111111'),
   
  ('a3333333-3333-3333-3333-333333333333', 'Energy Shield Technique', 'Create a protective energy barrier around yourself', 'https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?w=800', 'content',
   E'# Energy Shield Technique\n\nProtect your energy field from negative influences.\n\n## Steps:\n1. Close your eyes and center yourself\n2. Visualize a bubble of white light around you\n3. Set the intention that only positive energy can enter\n4. Reinforce with deep breathing\n5. Carry this shield throughout your day',
   NULL, '11111111-1111-1111-1111-111111111111'),
   
  ('a4444444-4444-4444-4444-444444444444', 'Third Eye Activation', 'Enhance your intuition and inner vision', 'https://images.unsplash.com/photo-1577253313708-cab167d2c474?w=800', 'link',
   NULL, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '11111111-1111-1111-1111-111111111111'),
   
  ('a5555555-5555-5555-5555-555555555555', 'Chakra Balancing', 'Align and balance your seven main energy centers', 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=800', 'content',
   E'# Chakra Balancing\n\nBalance all seven chakras for optimal energy flow.\n\n## Chakra Colors:\n- Root: Red\n- Sacral: Orange\n- Solar Plexus: Yellow\n- Heart: Green\n- Throat: Blue\n- Third Eye: Indigo\n- Crown: Violet',
   NULL, '11111111-1111-1111-1111-111111111111'),
   
  ('a6666666-6666-6666-6666-666666666666', 'Breathwork for Energy', 'Use conscious breathing to increase your energy levels', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 'content',
   E'# Breathwork for Energy\n\nPowerful breathing techniques to boost your energy.\n\n## Technique 1: Bellows Breath\n- Rapid diaphragmatic breathing\n- 30 breaths, then hold\n- Repeat 3 rounds',
   NULL, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- External link for the link-type hack is already set in the INSERT above

-- Assign tags to hacks
INSERT INTO public.hack_tags (hack_id, tag_id, assigned_by)
VALUES 
  -- Morning Energy Boost - Beginner, Morning Person
  ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('a1111111-1111-1111-1111-111111111111', '11111111-2222-3333-4444-555555555555', '11111111-1111-1111-1111-111111111111'),
  
  -- Grounding Meditation - Beginner, Meditation
  ('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('a2222222-2222-2222-2222-222222222222', '33333333-4444-5555-6666-777777777777', '11111111-1111-1111-1111-111111111111'),
  
  -- Energy Shield - Intermediate, Energy Worker
  ('a3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('a3333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111'),
  
  -- Third Eye - Advanced, Energy Master, Meditation
  ('a4444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111'),
  ('a4444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111'),
  ('a4444444-4444-4444-4444-444444444444', '33333333-4444-5555-6666-777777777777', '11111111-1111-1111-1111-111111111111'),
  
  -- Chakra Balancing - Intermediate, Energy Worker, Meditation
  ('a5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('a5555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111'),
  ('a5555555-5555-5555-5555-555555555555', '33333333-4444-5555-6666-777777777777', '11111111-1111-1111-1111-111111111111'),
  
  -- Breathwork - Beginner, Breathwork
  ('a6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('a6666666-6666-6666-6666-666666666666', '44444444-5555-6666-7777-888888888888', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (hack_id, tag_id) DO NOTHING;

-- Assign tags to users based on their Discord roles
INSERT INTO public.user_tags (user_id, tag_id, source)
VALUES 
  -- Admin gets: Energy Master, Verified
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'discord'),
  ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'discord'),
  
  -- Test User gets: Beginner, Verified
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'discord'),
  ('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'discord'),
  
  -- John gets: Intermediate, Energy Worker
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'discord'),
  ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'discord')
ON CONFLICT (user_id, tag_id) DO NOTHING;

-- Add some likes and completions
INSERT INTO public.user_hack_likes (user_id, hack_id)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333')
ON CONFLICT (user_id, hack_id) DO NOTHING;

INSERT INTO public.user_hack_completions (user_id, hack_id)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id, hack_id) DO NOTHING;