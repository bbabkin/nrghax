-- Test RLS policies for hacks feature
begin;
select plan(12);

-- Create test users
SELECT tests.create_supabase_user('test_admin');
SELECT tests.create_supabase_user('test_user');

-- Update admin user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object('is_admin', true)
WHERE id = tests.get_supabase_uid('test_admin');

-- Test that policies exist
SELECT policies_are(
    'public',
    'hacks',
    ARRAY[
        'Hacks are viewable by everyone',
        'Only admins can insert hacks',
        'Only admins can update hacks',
        'Only admins can delete hacks'
    ],
    'hacks table should have the correct policies'
);

SELECT policies_are(
    'public',
    'user_hack_completions',
    ARRAY[
        'Users can view all completions',
        'Users can mark hacks as completed',
        'Users cannot update completions',
        'Users cannot delete completions'
    ],
    'user_hack_completions table should have the correct policies'
);

-- Test public read access to hacks
SELECT tests.clear_authentication();
SELECT isnt_empty(
    $$ SELECT * FROM hacks $$,
    'Anonymous users can view hacks'
);

-- Test that anonymous users cannot create hacks
SELECT throws_ok(
    $$ INSERT INTO hacks (name, description, image_url, content_type, content_body) 
       VALUES ('Test', 'Test', 'http://test.com', 'content', 'Test content') $$,
    '42501',
    'new row violates row-level security policy for table "hacks"',
    'Anonymous users cannot create hacks'
);

-- Test admin can create hacks
SELECT tests.authenticate_as('test_admin');
SELECT lives_ok(
    $$ INSERT INTO hacks (name, description, image_url, content_type, content_body) 
       VALUES ('Admin Test Hack', 'Test', 'http://test.com', 'content', 'Test content') 
       RETURNING id $$,
    'Admin users can create hacks'
);

-- Get the hack id for further tests
CREATE TEMP TABLE test_hack AS
SELECT id FROM hacks WHERE name = 'Admin Test Hack' LIMIT 1;

-- Test regular user cannot update hacks
SELECT tests.authenticate_as('test_user');
SELECT throws_ok(
    $$ UPDATE hacks SET name = 'Modified' WHERE id = (SELECT id FROM test_hack) $$,
    '42501',
    'new row violates row-level security policy for table "hacks"',
    'Regular users cannot update hacks'
);

-- Test regular user can complete a hack
SELECT lives_ok(
    $$ INSERT INTO user_hack_completions (hack_id, user_id) 
       VALUES ((SELECT id FROM test_hack), tests.get_supabase_uid('test_user')) $$,
    'Regular users can mark hacks as completed'
);

-- Test user can like a hack
SELECT lives_ok(
    $$ INSERT INTO user_hack_likes (hack_id, user_id) 
       VALUES ((SELECT id FROM test_hack), tests.get_supabase_uid('test_user')) $$,
    'Regular users can like hacks'
);

-- Test admin can delete hacks
SELECT tests.authenticate_as('test_admin');
SELECT lives_ok(
    $$ DELETE FROM hacks WHERE id = (SELECT id FROM test_hack) $$,
    'Admin users can delete hacks'
);

-- Clean up test users
SELECT tests.clear_authentication();

select * from finish();
rollback;