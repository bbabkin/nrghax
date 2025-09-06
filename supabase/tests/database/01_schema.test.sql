-- Test that our hacks tables and columns exist
begin;
select plan(16);

-- Test that tables exist
SELECT has_table('public', 'hacks', 'hacks table should exist');
SELECT has_table('public', 'hack_prerequisites', 'hack_prerequisites table should exist');
SELECT has_table('public', 'user_hack_completions', 'user_hack_completions table should exist');
SELECT has_table('public', 'user_hack_likes', 'user_hack_likes table should exist');

-- Test hacks table columns
SELECT has_column('public', 'hacks', 'id', 'hacks.id should exist');
SELECT has_column('public', 'hacks', 'name', 'hacks.name should exist');
SELECT has_column('public', 'hacks', 'description', 'hacks.description should exist');
SELECT has_column('public', 'hacks', 'image_url', 'hacks.image_url should exist');
SELECT has_column('public', 'hacks', 'content_type', 'hacks.content_type should exist');
SELECT has_column('public', 'hacks', 'content_body', 'hacks.content_body should exist');
SELECT has_column('public', 'hacks', 'external_link', 'hacks.external_link should exist');

-- Test foreign key relationships
SELECT has_fk('public', 'hack_prerequisites', 'hack_prerequisites_hack_id_fkey');
SELECT has_fk('public', 'hack_prerequisites', 'hack_prerequisites_prerequisite_id_fkey');
SELECT has_fk('public', 'user_hack_completions', 'user_hack_completions_hack_id_fkey');
SELECT has_fk('public', 'user_hack_completions', 'user_hack_completions_user_id_fkey');
SELECT has_fk('public', 'user_hack_likes', 'user_hack_likes_hack_id_fkey');

select * from finish();
rollback;