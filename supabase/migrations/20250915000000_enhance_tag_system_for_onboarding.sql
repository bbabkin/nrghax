-- Add tag_type enum for categorizing tags
CREATE TYPE public.tag_type AS ENUM (
    'user_experience',  -- Mutually exclusive: beginner, intermediate, expert
    'user_interest',    -- Can have multiple: web-security, binary, cryptography, networking
    'user_special',     -- Admin-managed: mentor, contributor, verified
    'content'          -- For hacks only: difficulty levels, topics, prerequisites
);

-- Add new columns to tags table
ALTER TABLE public.tags
ADD COLUMN tag_type public.tag_type DEFAULT 'content',
ADD COLUMN discord_role_name TEXT,
ADD COLUMN discord_role_id TEXT,
ADD COLUMN is_user_assignable BOOLEAN DEFAULT false,
ADD COLUMN display_order INTEGER DEFAULT 0,
ADD COLUMN description TEXT;

-- Add source enum for tracking where assignments come from
CREATE TYPE public.tag_source AS ENUM (
    'onboarding',
    'discord',
    'admin',
    'system'
);

-- Enhance user_tags table with updated_at for conflict resolution
ALTER TABLE public.user_tags
DROP COLUMN source,
ADD COLUMN source public.tag_source DEFAULT 'system',
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL;

-- Create tag_sync_log table for tracking synchronization history
CREATE TABLE IF NOT EXISTS public.tag_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('added', 'removed', 'conflict_resolved')),
    source public.tag_source NOT NULL,
    target TEXT CHECK (target IN ('web', 'discord')),
    previous_value JSONB,
    new_value JSONB,
    conflict_details JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create onboarding_responses table to track questionnaire answers
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    answer JSONB NOT NULL,
    completed_at TIMESTAMPTZ,
    skipped BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, question_id)
);

-- Create indexes for performance
CREATE INDEX idx_tags_tag_type ON public.tags(tag_type);
CREATE INDEX idx_tags_is_user_assignable ON public.tags(is_user_assignable);
CREATE INDEX idx_tags_discord_role_id ON public.tags(discord_role_id) WHERE discord_role_id IS NOT NULL;
CREATE INDEX idx_user_tags_updated_at ON public.user_tags(updated_at);
CREATE INDEX idx_tag_sync_log_user_id ON public.tag_sync_log(user_id);
CREATE INDEX idx_tag_sync_log_created_at ON public.tag_sync_log(created_at);
CREATE INDEX idx_onboarding_responses_user_id ON public.onboarding_responses(user_id);

-- Function to enforce tag_type rules (mutual exclusivity for user_experience)
CREATE OR REPLACE FUNCTION enforce_tag_type_rules()
RETURNS TRIGGER AS $$
DECLARE
    tag_type_val public.tag_type;
    existing_count INTEGER;
BEGIN
    -- Get the tag type for the new tag
    SELECT tag_type INTO tag_type_val
    FROM public.tags
    WHERE id = NEW.tag_id;

    -- If it's a user_experience tag, check for existing ones
    IF tag_type_val = 'user_experience' THEN
        -- Count existing user_experience tags for this user
        SELECT COUNT(*) INTO existing_count
        FROM public.user_tags ut
        INNER JOIN public.tags t ON ut.tag_id = t.id
        WHERE ut.user_id = NEW.user_id
        AND t.tag_type = 'user_experience'
        AND ut.tag_id != NEW.tag_id;

        -- If there are existing user_experience tags, remove them
        IF existing_count > 0 THEN
            DELETE FROM public.user_tags
            WHERE user_id = NEW.user_id
            AND tag_id IN (
                SELECT ut.tag_id
                FROM public.user_tags ut
                INNER JOIN public.tags t ON ut.tag_id = t.id
                WHERE ut.user_id = NEW.user_id
                AND t.tag_type = 'user_experience'
                AND ut.tag_id != NEW.tag_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_tag_type_rules
    BEFORE INSERT OR UPDATE ON public.user_tags
    FOR EACH ROW
    EXECUTE FUNCTION enforce_tag_type_rules();

-- Function to update user_tags.updated_at on changes
CREATE OR REPLACE FUNCTION update_user_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_tags_updated_at
    BEFORE UPDATE ON public.user_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tags_updated_at();

-- Function to assign tags based on onboarding responses
CREATE OR REPLACE FUNCTION assign_tags_from_onboarding(
    p_user_id UUID,
    p_responses JSONB
)
RETURNS VOID AS $$
DECLARE
    response JSONB;
    tag_ids UUID[];
    tag_id UUID;
BEGIN
    -- Clear existing onboarding-sourced tags for the user
    DELETE FROM public.user_tags
    WHERE user_id = p_user_id
    AND source = 'onboarding';

    -- Parse responses and determine tags to assign
    -- This is a placeholder - actual logic will be implemented in application code
    -- For now, just store the responses
    FOR response IN SELECT * FROM jsonb_array_elements(p_responses)
    LOOP
        INSERT INTO public.onboarding_responses (user_id, question_id, answer)
        VALUES (p_user_id, response->>'question_id', response->'answer')
        ON CONFLICT (user_id, question_id)
        DO UPDATE SET answer = EXCLUDED.answer;
    END LOOP;

    -- Mark onboarding as completed
    UPDATE public.onboarding_responses
    SET completed_at = TIMEZONE('utc', NOW())
    WHERE user_id = p_user_id
    AND completed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync tags between web and Discord
CREATE OR REPLACE FUNCTION sync_user_tags_bidirectional(
    p_user_id UUID,
    p_source public.tag_source,
    p_tag_changes JSONB
)
RETURNS JSONB AS $$
DECLARE
    change JSONB;
    tag_rec RECORD;
    conflict_count INTEGER := 0;
    sync_result JSONB := '{"added": [], "removed": [], "conflicts": []}'::JSONB;
BEGIN
    -- Process each tag change
    FOR change IN SELECT * FROM jsonb_array_elements(p_tag_changes)
    LOOP
        -- Get tag details
        SELECT t.*, ut.updated_at as existing_updated_at, ut.source as existing_source
        INTO tag_rec
        FROM public.tags t
        LEFT JOIN public.user_tags ut ON ut.tag_id = t.id AND ut.user_id = p_user_id
        WHERE t.id = (change->>'tag_id')::UUID
        OR t.discord_role_id = change->>'discord_role_id';

        IF change->>'action' = 'add' THEN
            -- Check for conflicts based on tag_type
            IF tag_rec.tag_type = 'user_experience' THEN
                -- Remove existing user_experience tags (enforced by trigger)
                NULL; -- Trigger will handle this
            END IF;

            -- Add the tag
            INSERT INTO public.user_tags (user_id, tag_id, source, updated_at)
            VALUES (p_user_id, tag_rec.id, p_source, TIMEZONE('utc', NOW()))
            ON CONFLICT (user_id, tag_id)
            DO UPDATE SET
                source = EXCLUDED.source,
                updated_at = EXCLUDED.updated_at
            WHERE public.user_tags.updated_at < EXCLUDED.updated_at;

            -- Log the sync
            INSERT INTO public.tag_sync_log (user_id, tag_id, action, source, target, new_value)
            VALUES (p_user_id, tag_rec.id, 'added', p_source,
                    CASE WHEN p_source = 'discord' THEN 'web' ELSE 'discord' END,
                    jsonb_build_object('tag_name', tag_rec.name, 'tag_type', tag_rec.tag_type));

            sync_result := jsonb_set(sync_result, '{added}',
                sync_result->'added' || to_jsonb(tag_rec.name));

        ELSIF change->>'action' = 'remove' THEN
            -- Remove the tag
            DELETE FROM public.user_tags
            WHERE user_id = p_user_id AND tag_id = tag_rec.id;

            -- Log the sync
            INSERT INTO public.tag_sync_log (user_id, tag_id, action, source, target, previous_value)
            VALUES (p_user_id, tag_rec.id, 'removed', p_source,
                    CASE WHEN p_source = 'discord' THEN 'web' ELSE 'discord' END,
                    jsonb_build_object('tag_name', tag_rec.name, 'tag_type', tag_rec.tag_type));

            sync_result := jsonb_set(sync_result, '{removed}',
                sync_result->'removed' || to_jsonb(tag_rec.name));
        END IF;
    END LOOP;

    RETURN sync_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to get recommended hacks with better matching logic
CREATE OR REPLACE FUNCTION get_personalized_hacks(p_user_id UUID)
RETURNS TABLE (
    hack_id UUID,
    hack_name TEXT,
    hack_description TEXT,
    hack_difficulty TEXT,
    hack_time_minutes INTEGER,
    hack_image_url TEXT,
    hack_created_at TIMESTAMPTZ,
    relevance_score INTEGER,
    matching_tags TEXT[]
) AS $$
DECLARE
    user_experience_level TEXT;
    user_interests TEXT[];
BEGIN
    -- Get user's experience level
    SELECT t.name INTO user_experience_level
    FROM public.user_tags ut
    INNER JOIN public.tags t ON ut.tag_id = t.id
    WHERE ut.user_id = p_user_id
    AND t.tag_type = 'user_experience'
    LIMIT 1;

    -- Get user's interests
    SELECT ARRAY_AGG(t.name) INTO user_interests
    FROM public.user_tags ut
    INNER JOIN public.tags t ON ut.tag_id = t.id
    WHERE ut.user_id = p_user_id
    AND t.tag_type = 'user_interest';

    -- If user has no tags, return all active hacks
    IF user_experience_level IS NULL AND user_interests IS NULL THEN
        RETURN QUERY
        SELECT
            h.id,
            h.name,
            h.description,
            h.difficulty,
            h.time_minutes,
            h.image_url,
            h.created_at,
            0 as relevance_score,
            ARRAY[]::TEXT[] as matching_tags
        FROM public.hacks h
        WHERE h.status = 'active'
        ORDER BY h.created_at DESC;
    ELSE
        -- Return hacks matching user's interests and appropriate for experience level
        RETURN QUERY
        WITH hack_matches AS (
            SELECT
                h.id,
                h.name,
                h.description,
                h.difficulty,
                h.time_minutes,
                h.image_url,
                h.created_at,
                ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name = ANY(user_interests)) as interest_matches,
                COUNT(DISTINCT t.id) FILTER (WHERE t.name = ANY(user_interests)) as interest_match_count,
                MAX(CASE
                    WHEN t.name = user_experience_level THEN 3
                    WHEN user_experience_level = 'beginner' AND h.difficulty = 'easy' THEN 2
                    WHEN user_experience_level = 'intermediate' AND h.difficulty IN ('easy', 'medium') THEN 2
                    WHEN user_experience_level = 'expert' AND h.difficulty IN ('medium', 'hard') THEN 2
                    ELSE 1
                END) as experience_match_score
            FROM public.hacks h
            LEFT JOIN public.hack_tags ht ON h.id = ht.hack_id
            LEFT JOIN public.tags t ON ht.tag_id = t.id
            WHERE h.status = 'active'
            GROUP BY h.id, h.name, h.description, h.difficulty, h.time_minutes, h.image_url, h.created_at
        )
        SELECT
            id,
            name,
            description,
            difficulty,
            time_minutes,
            image_url,
            created_at,
            (COALESCE(interest_match_count, 0) * 10 + experience_match_score)::INTEGER as relevance_score,
            COALESCE(interest_matches, ARRAY[]::TEXT[]) as matching_tags
        FROM hack_matches
        ORDER BY relevance_score DESC, created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for new tables
ALTER TABLE public.tag_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Tag sync log policies
CREATE POLICY "Users can view their own sync logs" ON public.tag_sync_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sync logs" ON public.tag_sync_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Onboarding responses policies
CREATE POLICY "Users can view their own responses" ON public.onboarding_responses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own responses" ON public.onboarding_responses
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all responses" ON public.onboarding_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Update existing policies to allow users to manage their own tags from onboarding
DROP POLICY IF EXISTS "Only admins can manage user tags" ON public.user_tags;

CREATE POLICY "Users can manage their onboarding tags" ON public.user_tags
    FOR ALL USING (
        user_id = auth.uid() AND source = 'onboarding'
    );

CREATE POLICY "Admins can manage all user tags" ON public.user_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.tag_sync_log TO authenticated;
GRANT ALL ON public.onboarding_responses TO authenticated;
GRANT EXECUTE ON FUNCTION assign_tags_from_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_tags_bidirectional TO authenticated;
GRANT EXECUTE ON FUNCTION get_personalized_hacks TO authenticated;
GRANT USAGE ON TYPE public.tag_type TO authenticated;
GRANT USAGE ON TYPE public.tag_source TO authenticated;