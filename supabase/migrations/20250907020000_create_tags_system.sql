-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Create unique indexes instead of constraints for case-insensitive uniqueness
CREATE UNIQUE INDEX tags_name_unique_idx ON public.tags(LOWER(name)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX tags_slug_unique_idx ON public.tags(slug) WHERE deleted_at IS NULL;

-- Create user_tags junction table
CREATE TABLE IF NOT EXISTS public.user_tags (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    source TEXT CHECK (source IN ('discord', 'manual', 'system')) DEFAULT 'system',
    PRIMARY KEY (user_id, tag_id)
);

-- Create hack_tags junction table
CREATE TABLE IF NOT EXISTS public.hack_tags (
    hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    PRIMARY KEY (hack_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_tags_slug ON public.tags(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_name_lower ON public.tags(LOWER(name)) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX idx_user_tags_tag_id ON public.user_tags(tag_id);
CREATE INDEX idx_user_tags_source ON public.user_tags(source);
CREATE INDEX idx_hack_tags_hack_id ON public.hack_tags(hack_id);
CREATE INDEX idx_hack_tags_tag_id ON public.hack_tags(tag_id);

-- Function to generate URL-safe slug from tag name
CREATE OR REPLACE FUNCTION generate_tag_slug(tag_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    TRIM(tag_name),
                    '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove non-alphanumeric chars except spaces and hyphens
                ),
                '\s+', '-', 'g'  -- Replace spaces with hyphens
            ),
            '-+', '-', 'g'  -- Replace multiple hyphens with single hyphen
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION update_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug := generate_tag_slug(NEW.name);
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_slug
    BEFORE INSERT OR UPDATE OF name ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_slug();

-- Function to check tag uniqueness (case-insensitive)
CREATE OR REPLACE FUNCTION check_tag_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.tags 
        WHERE LOWER(name) = LOWER(NEW.name) 
        AND id != COALESCE(NEW.id, gen_random_uuid())
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Tag with name "%" already exists (case-insensitive)', NEW.name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_tag_uniqueness
    BEFORE INSERT OR UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION check_tag_uniqueness();

-- RLS Policies
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hack_tags ENABLE ROW LEVEL SECURITY;

-- Tags policies (read for all, write for admins only)
CREATE POLICY "Tags are viewable by everyone" ON public.tags
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Only admins can create tags" ON public.tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

CREATE POLICY "Only admins can update tags" ON public.tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

CREATE POLICY "Only admins can delete tags" ON public.tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- User tags policies
CREATE POLICY "Users can view their own tags" ON public.user_tags
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user tags" ON public.user_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

CREATE POLICY "Only admins can manage user tags" ON public.user_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Hack tags policies (viewable by all, editable by admins)
CREATE POLICY "Hack tags are viewable by everyone" ON public.hack_tags
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage hack tags" ON public.hack_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Function to sync Discord roles as tags
CREATE OR REPLACE FUNCTION sync_discord_role_as_tag(
    role_name TEXT,
    role_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    tag_id UUID;
    tag_slug TEXT;
BEGIN
    -- Generate slug for the role name
    tag_slug := generate_tag_slug(role_name);
    
    -- Check if tag already exists
    SELECT id INTO tag_id
    FROM public.tags
    WHERE LOWER(name) = LOWER(role_name)
    OR slug = tag_slug
    LIMIT 1;
    
    -- If not exists, create it
    IF tag_id IS NULL THEN
        INSERT INTO public.tags (name, slug, created_by)
        VALUES (role_name, tag_slug, NULL)
        RETURNING id INTO tag_id;
    END IF;
    
    RETURN tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recommended hacks based on user tags (AND logic)
CREATE OR REPLACE FUNCTION get_recommended_hacks(user_uuid UUID)
RETURNS TABLE (
    hack_id UUID,
    hack_name TEXT,
    hack_description TEXT,
    hack_difficulty TEXT,
    hack_time_minutes INTEGER,
    hack_image_url TEXT,
    hack_created_at TIMESTAMPTZ,
    matching_tags TEXT[]
) AS $$
DECLARE
    user_tag_count INTEGER;
BEGIN
    -- Get count of user's tags
    SELECT COUNT(*) INTO user_tag_count
    FROM public.user_tags
    WHERE user_id = user_uuid;
    
    -- If user has no tags, return all active hacks
    IF user_tag_count = 0 THEN
        RETURN QUERY
        SELECT 
            h.id,
            h.name,
            h.description,
            h.difficulty,
            h.time_minutes,
            h.image_url,
            h.created_at,
            ARRAY[]::TEXT[] as matching_tags
        FROM public.hacks h
        WHERE h.status = 'active'
        ORDER BY h.created_at DESC;
    ELSE
        -- Return hacks that match ALL user tags (AND logic)
        RETURN QUERY
        SELECT 
            h.id,
            h.name,
            h.description,
            h.difficulty,
            h.time_minutes,
            h.image_url,
            h.created_at,
            ARRAY_AGG(t.name) as matching_tags
        FROM public.hacks h
        INNER JOIN public.hack_tags ht ON h.id = ht.hack_id
        INNER JOIN public.tags t ON ht.tag_id = t.id
        WHERE h.status = 'active'
        AND t.id IN (
            SELECT tag_id FROM public.user_tags WHERE user_id = user_uuid
        )
        GROUP BY h.id, h.name, h.description, h.difficulty, h.time_minutes, h.image_url, h.created_at
        HAVING COUNT(DISTINCT t.id) = user_tag_count
        ORDER BY h.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.user_tags TO authenticated;
GRANT ALL ON public.hack_tags TO authenticated;
GRANT EXECUTE ON FUNCTION generate_tag_slug TO authenticated;
GRANT EXECUTE ON FUNCTION sync_discord_role_as_tag TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_hacks TO authenticated;