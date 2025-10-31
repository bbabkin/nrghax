-- Create a test user if not exists (using Supabase Auth)
-- First, we need to get a user ID from the auth.users table
-- For testing, we'll use the first user or create mock data

-- Insert some test completion data for demonstration
-- This assumes you have at least one user in the system
-- Replace the user_id with an actual user ID from your database

DO $$
DECLARE
    test_user_id UUID;
    hack_id_1 UUID;
    hack_id_2 UUID;
    hack_id_3 UUID;
    hack_id_4 UUID;
    hack_id_5 UUID;
BEGIN
    -- Get first user ID or use a placeholder
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    -- If no user exists, create a test profile
    IF test_user_id IS NULL THEN
        test_user_id := gen_random_uuid();
        INSERT INTO public.profiles (id, email, name, is_admin)
        VALUES (test_user_id, 'test@example.com', 'Test User', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Get some hack IDs
    SELECT id INTO hack_id_1 FROM public.hacks LIMIT 1 OFFSET 0;
    SELECT id INTO hack_id_2 FROM public.hacks LIMIT 1 OFFSET 1;
    SELECT id INTO hack_id_3 FROM public.hacks LIMIT 1 OFFSET 2;
    SELECT id INTO hack_id_4 FROM public.hacks LIMIT 1 OFFSET 3;
    SELECT id INTO hack_id_5 FROM public.hacks LIMIT 1 OFFSET 4;

    -- Insert user_hacks with different completion counts for demonstration
    -- Hack 1: Completed once (green)
    INSERT INTO public.user_hacks (user_id, hack_id, viewed, completion_count, completed_at)
    VALUES (test_user_id, hack_id_1, true, 1, NOW())
    ON CONFLICT (user_id, hack_id)
    DO UPDATE SET completion_count = 1, completed_at = NOW();

    -- Hack 2: Completed 5 times (blue)
    INSERT INTO public.user_hacks (user_id, hack_id, viewed, completion_count, completed_at)
    VALUES (test_user_id, hack_id_2, true, 5, NOW())
    ON CONFLICT (user_id, hack_id)
    DO UPDATE SET completion_count = 5, completed_at = NOW();

    -- Hack 3: Completed 25 times (purple)
    INSERT INTO public.user_hacks (user_id, hack_id, viewed, completion_count, completed_at)
    VALUES (test_user_id, hack_id_3, true, 25, NOW())
    ON CONFLICT (user_id, hack_id)
    DO UPDATE SET completion_count = 25, completed_at = NOW();

    -- Hack 4: Completed 75 times (orange)
    INSERT INTO public.user_hacks (user_id, hack_id, viewed, completion_count, completed_at)
    VALUES (test_user_id, hack_id_4, true, 75, NOW())
    ON CONFLICT (user_id, hack_id)
    DO UPDATE SET completion_count = 75, completed_at = NOW();

    -- Hack 5: Viewed but not completed (gray - 0 completions)
    INSERT INTO public.user_hacks (user_id, hack_id, viewed, completion_count)
    VALUES (test_user_id, hack_id_5, true, 0)
    ON CONFLICT (user_id, hack_id)
    DO UPDATE SET completion_count = 0;

    RAISE NOTICE 'Test data added successfully for user %', test_user_id;
END $$;