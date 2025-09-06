-- Test database functions
begin;
select plan(6);

-- Create test users
SELECT tests.create_supabase_user('test_user1');
SELECT tests.create_supabase_user('test_admin');

-- Update admin user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object('is_admin', true)
WHERE id = tests.get_supabase_uid('test_admin');

-- Create test hacks as admin
SELECT tests.authenticate_as('test_admin');

INSERT INTO hacks (id, name, description, image_url, content_type, content_body)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Basic Hack', 'Basic concepts', 'http://test.com/1.jpg', 'content', 'Basic content'),
    ('22222222-2222-2222-2222-222222222222', 'Intermediate Hack', 'Intermediate concepts', 'http://test.com/2.jpg', 'content', 'Intermediate content'),
    ('33333333-3333-3333-3333-333333333333', 'Advanced Hack', 'Advanced concepts', 'http://test.com/3.jpg', 'content', 'Advanced content');

-- Set up prerequisites: Advanced requires Intermediate, Intermediate requires Basic
INSERT INTO hack_prerequisites (hack_id, prerequisite_id)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

-- Test 1: User hasn't completed any prerequisites
SELECT tests.authenticate_as('test_user1');
SELECT is(
    check_prerequisites_completed(tests.get_supabase_uid('test_user1'), '33333333-3333-3333-3333-333333333333'),
    false,
    'Prerequisites should not be met when user has not completed any hacks'
);

-- Complete the basic hack
INSERT INTO user_hack_completions (user_id, hack_id)
VALUES (tests.get_supabase_uid('test_user1'), '11111111-1111-1111-1111-111111111111');

-- Test 2: User completed basic but not intermediate
SELECT is(
    check_prerequisites_completed(tests.get_supabase_uid('test_user1'), '33333333-3333-3333-3333-333333333333'),
    false,
    'Prerequisites should not be met when intermediate hack is not completed'
);

-- Test 3: User can access intermediate after completing basic
SELECT is(
    check_prerequisites_completed(tests.get_supabase_uid('test_user1'), '22222222-2222-2222-2222-222222222222'),
    true,
    'Prerequisites should be met for intermediate hack after completing basic'
);

-- Complete the intermediate hack
INSERT INTO user_hack_completions (user_id, hack_id)
VALUES (tests.get_supabase_uid('test_user1'), '22222222-2222-2222-2222-222222222222');

-- Test 4: User can now access advanced
SELECT is(
    check_prerequisites_completed(tests.get_supabase_uid('test_user1'), '33333333-3333-3333-3333-333333333333'),
    true,
    'Prerequisites should be met for advanced hack after completing intermediate'
);

-- Test 5: Hack with no prerequisites returns true
SELECT is(
    check_prerequisites_completed(tests.get_supabase_uid('test_user1'), '11111111-1111-1111-1111-111111111111'),
    true,
    'Hack with no prerequisites should always be accessible'
);

-- Test 6: Test circular dependency prevention
SELECT tests.authenticate_as('test_admin');
SELECT throws_ok(
    $$ INSERT INTO hack_prerequisites (hack_id, prerequisite_id)
       VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333') $$,
    'P0001',
    'Circular dependency detected',
    'Should prevent circular dependencies in prerequisites'
);

select * from finish();
rollback;