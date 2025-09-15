-- pgTAP tests for tag onboarding system
BEGIN;

SELECT plan(20);

-- Test tag_type enum exists
SELECT has_type('public', 'tag_type', 'tag_type enum should exist');
SELECT enum_has_labels('public', 'tag_type', ARRAY['user_experience', 'user_interest', 'user_special', 'content'],
    'tag_type should have correct values');

-- Test tag_source enum exists
SELECT has_type('public', 'tag_source', 'tag_source enum should exist');
SELECT enum_has_labels('public', 'tag_source', ARRAY['onboarding', 'discord', 'admin', 'system'],
    'tag_source should have correct values');

-- Test enhanced tags table structure
SELECT has_column('public', 'tags', 'tag_type', 'tags table should have tag_type column');
SELECT has_column('public', 'tags', 'discord_role_name', 'tags table should have discord_role_name column');
SELECT has_column('public', 'tags', 'discord_role_id', 'tags table should have discord_role_id column');
SELECT has_column('public', 'tags', 'is_user_assignable', 'tags table should have is_user_assignable column');
SELECT has_column('public', 'tags', 'display_order', 'tags table should have display_order column');
SELECT has_column('public', 'tags', 'description', 'tags table should have description column');

-- Test enhanced user_tags table structure
SELECT has_column('public', 'user_tags', 'source', 'user_tags table should have source column');
SELECT has_column('public', 'user_tags', 'updated_at', 'user_tags table should have updated_at column');

-- Test new tables exist
SELECT has_table('public', 'tag_sync_log', 'tag_sync_log table should exist');
SELECT has_table('public', 'onboarding_responses', 'onboarding_responses table should exist');

-- Test mutual exclusivity for user_experience tags
PREPARE test_mutual_exclusivity AS
WITH test_user AS (
    INSERT INTO public.profiles (id, email)
    VALUES ('11111111-1111-1111-1111-111111111111', 'test_user@test.com')
    RETURNING id
),
beginner_tag AS (
    INSERT INTO public.tags (name, slug, tag_type, is_user_assignable)
    VALUES ('Test Beginner', 'test-beginner', 'user_experience', true)
    RETURNING id
),
intermediate_tag AS (
    INSERT INTO public.tags (name, slug, tag_type, is_user_assignable)
    VALUES ('Test Intermediate', 'test-intermediate', 'user_experience', true)
    RETURNING id
),
first_assignment AS (
    INSERT INTO public.user_tags (user_id, tag_id, source)
    SELECT test_user.id, beginner_tag.id, 'onboarding'
    FROM test_user, beginner_tag
    RETURNING user_id, tag_id
),
second_assignment AS (
    -- This should remove the beginner tag due to mutual exclusivity
    INSERT INTO public.user_tags (user_id, tag_id, source)
    SELECT test_user.id, intermediate_tag.id, 'onboarding'
    FROM test_user, intermediate_tag
    RETURNING user_id, tag_id
)
SELECT COUNT(*) = 1 as has_only_one
FROM public.user_tags ut
INNER JOIN public.tags t ON ut.tag_id = t.id
WHERE ut.user_id = '11111111-1111-1111-1111-111111111111'
AND t.tag_type = 'user_experience';

SELECT ok(
    (SELECT has_only_one FROM test_mutual_exclusivity),
    'User should only have one user_experience tag at a time'
);

-- Test multiple user_interest tags allowed
PREPARE test_multiple_interests AS
WITH test_user AS (
    INSERT INTO public.profiles (id, email)
    VALUES ('22222222-2222-2222-2222-222222222222', 'test_user2@test.com')
    ON CONFLICT (id) DO NOTHING
    RETURNING id
),
web_tag AS (
    INSERT INTO public.tags (name, slug, tag_type, is_user_assignable)
    VALUES ('Test Web', 'test-web', 'user_interest', true)
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET tag_type = 'user_interest'
    RETURNING id
),
crypto_tag AS (
    INSERT INTO public.tags (name, slug, tag_type, is_user_assignable)
    VALUES ('Test Crypto', 'test-crypto', 'user_interest', true)
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET tag_type = 'user_interest'
    RETURNING id
),
assignments AS (
    INSERT INTO public.user_tags (user_id, tag_id, source)
    SELECT test_user.id, web_tag.id, 'onboarding'
    FROM test_user, web_tag
    UNION ALL
    SELECT test_user.id, crypto_tag.id, 'onboarding'
    FROM test_user, crypto_tag
    ON CONFLICT (user_id, tag_id) DO NOTHING
    RETURNING user_id, tag_id
)
SELECT COUNT(*) = 2 as has_two
FROM public.user_tags ut
INNER JOIN public.tags t ON ut.tag_id = t.id
WHERE ut.user_id = '22222222-2222-2222-2222-222222222222'
AND t.tag_type = 'user_interest';

SELECT ok(
    (SELECT has_two FROM test_multiple_interests),
    'User can have multiple user_interest tags'
);

-- Test onboarding responses unique constraint
PREPARE test_onboarding_unique AS
WITH test_user AS (
    INSERT INTO public.profiles (id, email)
    VALUES ('33333333-3333-3333-3333-333333333333', 'test_user3@test.com')
    ON CONFLICT (id) DO NOTHING
    RETURNING id
),
first_response AS (
    INSERT INTO public.onboarding_responses (user_id, question_id, answer)
    SELECT id, 'q1', '{"value": "beginner"}'::jsonb
    FROM test_user
    ON CONFLICT (user_id, question_id) DO NOTHING
    RETURNING id
),
second_response AS (
    INSERT INTO public.onboarding_responses (user_id, question_id, answer)
    SELECT id, 'q1', '{"value": "intermediate"}'::jsonb
    FROM test_user
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET answer = EXCLUDED.answer
    RETURNING id, answer
)
SELECT answer->>'value' = 'intermediate' as is_updated
FROM second_response;

SELECT ok(
    (SELECT is_updated FROM test_onboarding_unique),
    'Onboarding responses should update on conflict'
);

-- Test tag sync log creation
PREPARE test_sync_log AS
WITH test_user AS (
    INSERT INTO public.profiles (id, email)
    VALUES ('44444444-4444-4444-4444-444444444444', 'test_user4@test.com')
    ON CONFLICT (id) DO NOTHING
    RETURNING id
),
test_tag AS (
    INSERT INTO public.tags (name, slug, tag_type)
    VALUES ('Test Sync Tag', 'test-sync-tag', 'user_interest')
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET tag_type = 'user_interest'
    RETURNING id
),
sync_entry AS (
    INSERT INTO public.tag_sync_log (user_id, tag_id, action, source, target, new_value)
    SELECT test_user.id, test_tag.id, 'added', 'discord', 'web',
           '{"tag_name": "Test Sync Tag", "tag_type": "user_interest"}'::jsonb
    FROM test_user, test_tag
    RETURNING id
)
SELECT COUNT(*) = 1 as has_log
FROM sync_entry;

SELECT ok(
    (SELECT has_log FROM test_sync_log),
    'Tag sync log should record synchronization events'
);

-- Test get_personalized_hacks function exists
SELECT has_function('public', 'get_personalized_hacks', ARRAY['uuid'],
    'get_personalized_hacks function should exist');

-- Test assign_tags_from_onboarding function exists
SELECT has_function('public', 'assign_tags_from_onboarding', ARRAY['uuid', 'jsonb'],
    'assign_tags_from_onboarding function should exist');

-- Test sync_user_tags_bidirectional function exists
SELECT has_function('public', 'sync_user_tags_bidirectional', ARRAY['uuid', 'tag_source', 'jsonb'],
    'sync_user_tags_bidirectional function should exist');

-- Clean up test data
DELETE FROM public.onboarding_responses WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

DELETE FROM public.tag_sync_log WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

DELETE FROM public.user_tags WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

DELETE FROM public.profiles WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

DELETE FROM public.tags WHERE slug LIKE 'test-%';

SELECT * FROM finish();
ROLLBACK;