-- Create hacks table
CREATE TABLE IF NOT EXISTS public.hacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('content', 'link')),
    content_body TEXT,
    external_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT content_xor_link CHECK (
        (content_type = 'content' AND content_body IS NOT NULL AND external_link IS NULL) OR
        (content_type = 'link' AND external_link IS NOT NULL AND content_body IS NULL)
    )
);

-- Create hack_prerequisites junction table
CREATE TABLE IF NOT EXISTS public.hack_prerequisites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    prerequisite_hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hack_id, prerequisite_hack_id),
    CONSTRAINT no_self_prerequisite CHECK (hack_id != prerequisite_hack_id)
);

-- Create user_hack_completions table
CREATE TABLE IF NOT EXISTS public.user_hack_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, hack_id)
);

-- Create user_hack_likes table
CREATE TABLE IF NOT EXISTS public.user_hack_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, hack_id)
);

-- Create indexes for performance
CREATE INDEX idx_hack_prerequisites_hack_id ON public.hack_prerequisites(hack_id);
CREATE INDEX idx_hack_prerequisites_prerequisite_hack_id ON public.hack_prerequisites(prerequisite_hack_id);
CREATE INDEX idx_user_hack_completions_user_id ON public.user_hack_completions(user_id);
CREATE INDEX idx_user_hack_completions_hack_id ON public.user_hack_completions(hack_id);
CREATE INDEX idx_user_hack_likes_user_id ON public.user_hack_likes(user_id);
CREATE INDEX idx_user_hack_likes_hack_id ON public.user_hack_likes(hack_id);

-- Function to check if user has completed all prerequisites for a hack
CREATE OR REPLACE FUNCTION public.check_prerequisites_completed(
    p_user_id UUID,
    p_hack_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    prerequisite_count INT;
    completed_count INT;
BEGIN
    -- Get count of prerequisites for this hack
    SELECT COUNT(*) INTO prerequisite_count
    FROM public.hack_prerequisites
    WHERE hack_id = p_hack_id;
    
    -- If no prerequisites, return true
    IF prerequisite_count = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Get count of completed prerequisites
    SELECT COUNT(*) INTO completed_count
    FROM public.hack_prerequisites hp
    INNER JOIN public.user_hack_completions uhc 
        ON hp.prerequisite_hack_id = uhc.hack_id
    WHERE hp.hack_id = p_hack_id 
        AND uhc.user_id = p_user_id;
    
    -- Return true if all prerequisites are completed
    RETURN prerequisite_count = completed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION public.check_circular_dependency(
    p_hack_id UUID,
    p_prerequisite_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    has_circular BOOLEAN;
BEGIN
    -- Check if adding this prerequisite would create a circular dependency
    WITH RECURSIVE prerequisite_chain AS (
        -- Start with the proposed prerequisite
        SELECT prerequisite_hack_id AS hack_id
        FROM public.hack_prerequisites
        WHERE hack_id = p_prerequisite_id
        
        UNION
        
        -- Recursively find all prerequisites of prerequisites
        SELECT hp.prerequisite_hack_id
        FROM public.hack_prerequisites hp
        INNER JOIN prerequisite_chain pc ON hp.hack_id = pc.hack_id
    )
    SELECT EXISTS (
        SELECT 1 FROM prerequisite_chain WHERE hack_id = p_hack_id
    ) INTO has_circular;
    
    RETURN has_circular;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get hack with aggregated data
CREATE OR REPLACE FUNCTION public.get_hack_with_stats(p_hack_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    image_url TEXT,
    content_type TEXT,
    content_body TEXT,
    external_link TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    like_count BIGINT,
    completion_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.description,
        h.image_url,
        h.content_type,
        h.content_body,
        h.external_link,
        h.created_at,
        h.updated_at,
        COUNT(DISTINCT uhl.id) AS like_count,
        COUNT(DISTINCT uhc.id) AS completion_count
    FROM public.hacks h
    LEFT JOIN public.user_hack_likes uhl ON h.id = uhl.hack_id
    LEFT JOIN public.user_hack_completions uhc ON h.id = uhc.hack_id
    WHERE h.id = p_hack_id
    GROUP BY h.id, h.name, h.description, h.image_url, h.content_type, 
             h.content_body, h.external_link, h.created_at, h.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE public.hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hack_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hack_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hack_likes ENABLE ROW LEVEL SECURITY;

-- Hacks policies
-- Everyone can read hacks
CREATE POLICY "Public hacks read access" ON public.hacks
    FOR SELECT USING (true);

-- Only admins can create hacks
CREATE POLICY "Admin create hacks" ON public.hacks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Only admins can update hacks
CREATE POLICY "Admin update hacks" ON public.hacks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Only admins can delete hacks
CREATE POLICY "Admin delete hacks" ON public.hacks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Hack prerequisites policies
-- Everyone can read prerequisites
CREATE POLICY "Public prerequisites read access" ON public.hack_prerequisites
    FOR SELECT USING (true);

-- Only admins can manage prerequisites
CREATE POLICY "Admin manage prerequisites" ON public.hack_prerequisites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- User hack completions policies
-- Users can read all completions (for displaying stats)
CREATE POLICY "Public completions read access" ON public.user_hack_completions
    FOR SELECT USING (true);

-- Users can insert their own completions
CREATE POLICY "Users insert own completions" ON public.user_hack_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete completions
-- No UPDATE or DELETE policies means these operations are blocked

-- User hack likes policies
-- Everyone can read likes
CREATE POLICY "Public likes read access" ON public.user_hack_likes
    FOR SELECT USING (true);

-- Users can insert their own likes
CREATE POLICY "Users insert own likes" ON public.user_hack_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users delete own likes" ON public.user_hack_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hacks table
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.hacks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();