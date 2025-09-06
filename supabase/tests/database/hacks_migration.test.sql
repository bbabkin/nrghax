-- Start test transaction
BEGIN;

-- Load pgTAP
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan tests
SELECT plan(12);

-- Test 1: hacks table exists
SELECT has_table('public', 'hacks', 'hacks table should exist');

-- Test 2: Check that image_url column is nullable
SELECT col_is_null('public', 'hacks', 'image_url', 'image_url should be nullable');

-- Test 3: Check that image_path column exists and is nullable
SELECT has_column('public', 'hacks', 'image_path', 'image_path column should exist');
SELECT col_is_null('public', 'hacks', 'image_path', 'image_path should be nullable');

-- Test 4: Check the image constraint exists
SELECT col_has_check('public', 'hacks', ARRAY['image_url', 'image_path'], 'Image check constraint should exist');

-- Test 5: Test that we can create a hack with only image_path
INSERT INTO public.hacks (name, description, image_path, content_type, content_body)
VALUES ('Test with image_path', 'Test', 'test/path.jpg', 'content', '<p>Test</p>');
SELECT pass('Can create hack with only image_path');

-- Test 6: Test that we can create a hack with only image_url
INSERT INTO public.hacks (name, description, image_url, content_type, content_body)
VALUES ('Test with image_url', 'Test', 'https://example.com/test.jpg', 'content', '<p>Test</p>');
SELECT pass('Can create hack with only image_url');

-- Test 7: Test that we cannot create a hack with neither image_url nor image_path
PREPARE no_image AS 
INSERT INTO public.hacks (name, description, content_type, content_body)
VALUES ('Test without image', 'Test', 'content', '<p>Test</p>');
SELECT throws_ok(
    'no_image',
    '23514',  -- check_violation error code
    'new row for relation "hacks" violates check constraint "hacks_image_check"',
    'Should not be able to create hack without any image'
);

-- Test 8: Storage bucket exists
SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'hack-images'
) AS bucket_exists;
SELECT ok((SELECT bucket_exists FROM (SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'hack-images') AS bucket_exists) t), 'hack-images storage bucket should exist');

-- Test 9: Storage bucket is public
SELECT is(
    (SELECT public FROM storage.buckets WHERE id = 'hack-images'),
    true,
    'hack-images bucket should be public'
);

-- Test 10: Check RLS policies exist for storage
SELECT COUNT(*) >= 4 AS has_policies FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%hack%';
SELECT ok((SELECT has_policies FROM (SELECT COUNT(*) >= 4 AS has_policies FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%hack%') t), 'Storage RLS policies for hack-images should exist');

-- Finish tests
SELECT * FROM finish();

-- Rollback transaction to clean up test data
ROLLBACK;