-- Script to add sample completion data for testing the color progression system
-- This will add varying completion counts to demonstrate the color progression

-- First, get a test user ID (use the first user or create one)
DO $$
DECLARE
    test_user_id uuid;
    hack_ids uuid[];
    i int;
BEGIN
    -- Get or create a test user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NULL THEN
        -- If no users exist, we can't add completion data
        RAISE NOTICE 'No users found. Please create a user account first.';
        RETURN;
    END IF;

    -- Get all hack IDs
    SELECT array_agg(id) INTO hack_ids FROM hacks;

    IF hack_ids IS NULL OR array_length(hack_ids, 1) IS NULL THEN
        RAISE NOTICE 'No hacks found.';
        RETURN;
    END IF;

    -- Add completion data with different counts to demonstrate colors
    -- Gray (0 completions) - skip some hacks
    -- Green (1 completion)
    FOR i IN 1..3 LOOP
        IF hack_ids[i] IS NOT NULL THEN
            INSERT INTO user_hacks (user_id, hack_id, completion_count, completed_at)
            VALUES (test_user_id, hack_ids[i], 1, now())
            ON CONFLICT (user_id, hack_id)
            DO UPDATE SET
                completion_count = 1,
                completed_at = now(),
                updated_at = now();
        END IF;
    END LOOP;

    -- Blue (2-10 completions)
    FOR i IN 4..6 LOOP
        IF hack_ids[i] IS NOT NULL THEN
            INSERT INTO user_hacks (user_id, hack_id, completion_count, completed_at)
            VALUES (test_user_id, hack_ids[i], 5, now())
            ON CONFLICT (user_id, hack_id)
            DO UPDATE SET
                completion_count = 5,
                completed_at = now(),
                updated_at = now();
        END IF;
    END LOOP;

    -- Purple (11-50 completions)
    FOR i IN 7..9 LOOP
        IF hack_ids[i] IS NOT NULL THEN
            INSERT INTO user_hacks (user_id, hack_id, completion_count, completed_at)
            VALUES (test_user_id, hack_ids[i], 25, now())
            ON CONFLICT (user_id, hack_id)
            DO UPDATE SET
                completion_count = 25,
                completed_at = now(),
                updated_at = now();
        END IF;
    END LOOP;

    -- Orange (50+ completions)
    FOR i IN 10..12 LOOP
        IF hack_ids[i] IS NOT NULL THEN
            INSERT INTO user_hacks (user_id, hack_id, completion_count, completed_at)
            VALUES (test_user_id, hack_ids[i], 100, now())
            ON CONFLICT (user_id, hack_id)
            DO UPDATE SET
                completion_count = 100,
                completed_at = now(),
                updated_at = now();
        END IF;
    END LOOP;

    -- Add some with status 'in_progress' to simulate partial completion
    FOR i IN 13..15 LOOP
        IF hack_ids[i] IS NOT NULL THEN
            INSERT INTO user_hacks (user_id, hack_id, completion_count, status, started_at)
            VALUES (test_user_id, hack_ids[i], 0, 'in_progress', now())
            ON CONFLICT (user_id, hack_id)
            DO UPDATE SET
                completion_count = 0,
                status = 'in_progress',
                started_at = now(),
                updated_at = now();
        END IF;
    END LOOP;

    RAISE NOTICE 'Test completion data added successfully for user %', test_user_id;
END $$;

-- Display the results
SELECT
    h.name,
    uh.completion_count,
    uh.status,
    CASE
        WHEN uh.completion_count IS NULL OR uh.completion_count = 0 THEN 'Gray'
        WHEN uh.completion_count = 1 THEN 'Green'
        WHEN uh.completion_count <= 10 THEN 'Blue'
        WHEN uh.completion_count <= 50 THEN 'Purple'
        ELSE 'Orange'
    END as color
FROM hacks h
LEFT JOIN user_hacks uh ON h.id = uh.hack_id AND uh.user_id = (SELECT id FROM auth.users LIMIT 1)
ORDER BY uh.completion_count DESC NULLS LAST;