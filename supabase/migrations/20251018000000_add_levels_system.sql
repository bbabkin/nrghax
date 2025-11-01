-- Create levels table
CREATE TABLE public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create level_prerequisites table for level dependencies
CREATE TABLE public.level_prerequisites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  prerequisite_level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(level_id, prerequisite_level_id),
  -- Prevent self-referencing prerequisites
  CHECK (level_id != prerequisite_level_id)
);

-- Create user_levels table for tracking user progress on levels
CREATE TABLE public.user_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  hacks_completed INTEGER DEFAULT 0,
  total_required_hacks INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, level_id)
);

-- Add level_id, icon, and is_required columns to hacks table
ALTER TABLE public.hacks
ADD COLUMN level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL,
ADD COLUMN icon TEXT,
ADD COLUMN is_required BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX idx_levels_slug ON public.levels(slug);
CREATE INDEX idx_levels_position ON public.levels(position);
CREATE INDEX idx_level_prerequisites_level_id ON public.level_prerequisites(level_id);
CREATE INDEX idx_level_prerequisites_prerequisite_level_id ON public.level_prerequisites(prerequisite_level_id);
CREATE INDEX idx_user_levels_user_id ON public.user_levels(user_id);
CREATE INDEX idx_user_levels_level_id ON public.user_levels(level_id);
CREATE INDEX idx_user_levels_completed ON public.user_levels(user_id, level_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_hacks_level_id ON public.hacks(level_id);
CREATE INDEX idx_hacks_level_required ON public.hacks(level_id, is_required);

-- Add updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_levels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for levels
CREATE POLICY "Levels are viewable by everyone" ON public.levels
  FOR SELECT USING (true);

CREATE POLICY "Only admins can create levels" ON public.levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update levels" ON public.levels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete levels" ON public.levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for level_prerequisites
CREATE POLICY "Level prerequisites are viewable by everyone" ON public.level_prerequisites
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage level prerequisites" ON public.level_prerequisites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for user_levels
CREATE POLICY "Users can view their own level progress" ON public.user_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track their own level progress" ON public.user_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own level progress" ON public.user_levels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own level progress" ON public.user_levels
  FOR DELETE USING (auth.uid() = user_id);

-- Create view for level details with progress
CREATE VIEW public.level_details AS
SELECT
  l.*,
  COUNT(DISTINCT h.id) FILTER (WHERE h.is_required = true) as required_hacks_count,
  COUNT(DISTINCT h.id) FILTER (WHERE h.is_required = false) as optional_hacks_count,
  COUNT(DISTINCT h.id) as total_hacks_count
FROM public.levels l
LEFT JOIN public.hacks h ON l.id = h.level_id
GROUP BY l.id;

-- Create function to check if level prerequisites are met for a user
CREATE OR REPLACE FUNCTION public.check_level_prerequisites_met(
  p_user_id UUID,
  p_level_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_unmet_prerequisites INTEGER;
BEGIN
  -- Count how many prerequisites are not completed
  SELECT COUNT(*)
  INTO v_unmet_prerequisites
  FROM public.level_prerequisites lp
  WHERE lp.level_id = p_level_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_levels ul
      WHERE ul.user_id = p_user_id
        AND ul.level_id = lp.prerequisite_level_id
        AND ul.completed_at IS NOT NULL
    );

  -- If no unmet prerequisites, return true
  RETURN v_unmet_prerequisites = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user level progress
CREATE OR REPLACE FUNCTION public.update_user_level_progress(
  p_user_id UUID,
  p_level_id UUID
)
RETURNS TABLE(hacks_completed INTEGER, total_required_hacks INTEGER, is_completed BOOLEAN) AS $$
DECLARE
  v_completed_hacks INTEGER;
  v_total_required INTEGER;
  v_is_completed BOOLEAN;
BEGIN
  -- Count completed required hacks in this level
  SELECT COUNT(DISTINCT h.id)
  INTO v_completed_hacks
  FROM public.hacks h
  INNER JOIN public.user_hacks uh ON h.id = uh.hack_id
  WHERE h.level_id = p_level_id
    AND h.is_required = true
    AND uh.user_id = p_user_id
    AND uh.completed_at IS NOT NULL;

  -- Count total required hacks in this level
  SELECT COUNT(*)
  INTO v_total_required
  FROM public.hacks
  WHERE level_id = p_level_id
    AND is_required = true;

  -- Determine if level is completed
  v_is_completed := (v_completed_hacks >= v_total_required AND v_total_required > 0);

  -- Insert or update user_levels record
  INSERT INTO public.user_levels (user_id, level_id, hacks_completed, total_required_hacks, completed_at)
  VALUES (
    p_user_id,
    p_level_id,
    v_completed_hacks,
    v_total_required,
    CASE WHEN v_is_completed THEN NOW() ELSE NULL END
  )
  ON CONFLICT (user_id, level_id)
  DO UPDATE SET
    hacks_completed = v_completed_hacks,
    total_required_hacks = v_total_required,
    completed_at = CASE WHEN v_is_completed THEN COALESCE(user_levels.completed_at, NOW()) ELSE NULL END,
    updated_at = NOW();

  RETURN QUERY SELECT v_completed_hacks, v_total_required, v_is_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_level_prerequisites_met TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_level_progress TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.levels IS 'Game-style progression levels containing related hacks';
COMMENT ON TABLE public.level_prerequisites IS 'Defines which levels must be completed before others unlock';
COMMENT ON TABLE public.user_levels IS 'Tracks user progress through each level';
COMMENT ON COLUMN public.hacks.level_id IS 'The level this hack belongs to';
COMMENT ON COLUMN public.hacks.icon IS 'Icon identifier for tree visualization';
COMMENT ON COLUMN public.hacks.is_required IS 'Whether this hack is required to complete the level';
COMMENT ON COLUMN public.user_levels.hacks_completed IS 'Number of required hacks completed in this level';
COMMENT ON COLUMN public.user_levels.total_required_hacks IS 'Total number of required hacks in this level';
COMMENT ON FUNCTION public.check_level_prerequisites_met IS 'Checks if all prerequisite levels are completed for a user';
COMMENT ON FUNCTION public.update_user_level_progress IS 'Updates user progress for a level and returns completion status';
