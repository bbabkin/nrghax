-- Create hack_checks table for checklist items
CREATE TABLE IF NOT EXISTS hack_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hack_id UUID NOT NULL REFERENCES hacks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT, -- Can contain HTML for rich content
  position INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_hack_checks table to track user progress
CREATE TABLE IF NOT EXISTS user_hack_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hack_check_id UUID NOT NULL REFERENCES hack_checks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ, -- NULL if not completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hack_check_id)
);

-- Add indexes for performance
CREATE INDEX idx_hack_checks_hack_id ON hack_checks(hack_id);
CREATE INDEX idx_hack_checks_position ON hack_checks(hack_id, position);
CREATE INDEX idx_user_hack_checks_user_id ON user_hack_checks(user_id);
CREATE INDEX idx_user_hack_checks_hack_check_id ON user_hack_checks(hack_check_id);
CREATE INDEX idx_user_hack_checks_user_hack ON user_hack_checks(user_id, hack_check_id);

-- Enable RLS
ALTER TABLE hack_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hack_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hack_checks
-- Everyone can read hack checks
CREATE POLICY "hack_checks_select_policy" ON hack_checks
  FOR SELECT
  USING (true);

-- Only hack creators and admins can insert/update/delete
CREATE POLICY "hack_checks_insert_policy" ON hack_checks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hacks h
      JOIN profiles p ON p.id = auth.uid()
      WHERE h.id = hack_checks.hack_id
      AND (h.created_by = auth.uid() OR p.is_admin = true)
    )
  );

CREATE POLICY "hack_checks_update_policy" ON hack_checks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hacks h
      JOIN profiles p ON p.id = auth.uid()
      WHERE h.id = hack_checks.hack_id
      AND (h.created_by = auth.uid() OR p.is_admin = true)
    )
  );

CREATE POLICY "hack_checks_delete_policy" ON hack_checks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hacks h
      JOIN profiles p ON p.id = auth.uid()
      WHERE h.id = hack_checks.hack_id
      AND (h.created_by = auth.uid() OR p.is_admin = true)
    )
  );

-- RLS Policies for user_hack_checks
-- Users can only see their own check progress
CREATE POLICY "user_hack_checks_select_policy" ON user_hack_checks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own check progress
CREATE POLICY "user_hack_checks_insert_policy" ON user_hack_checks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own check progress
CREATE POLICY "user_hack_checks_update_policy" ON user_hack_checks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own check progress
CREATE POLICY "user_hack_checks_delete_policy" ON user_hack_checks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER hack_checks_updated_at
  BEFORE UPDATE ON hack_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_hack_checks_updated_at
  BEFORE UPDATE ON user_hack_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add function to get hack completion status including checks
CREATE OR REPLACE FUNCTION can_complete_hack(p_hack_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if all required checks are completed
  RETURN NOT EXISTS (
    SELECT 1
    FROM hack_checks hc
    LEFT JOIN user_hack_checks uhc ON uhc.hack_check_id = hc.id AND uhc.user_id = p_user_id
    WHERE hc.hack_id = p_hack_id
    AND hc.is_required = true
    AND uhc.completed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get check progress for a hack
CREATE OR REPLACE FUNCTION get_hack_check_progress(p_hack_id UUID, p_user_id UUID)
RETURNS TABLE(
  total_checks INTEGER,
  completed_checks INTEGER,
  required_checks INTEGER,
  completed_required_checks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(hc.id)::INTEGER AS total_checks,
    COUNT(uhc.completed_at)::INTEGER AS completed_checks,
    COUNT(CASE WHEN hc.is_required THEN 1 END)::INTEGER AS required_checks,
    COUNT(CASE WHEN hc.is_required AND uhc.completed_at IS NOT NULL THEN 1 END)::INTEGER AS completed_required_checks
  FROM hack_checks hc
  LEFT JOIN user_hack_checks uhc ON uhc.hack_check_id = hc.id AND uhc.user_id = p_user_id
  WHERE hc.hack_id = p_hack_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE hack_checks IS 'Stores checklist items for hacks that users must complete';
COMMENT ON TABLE user_hack_checks IS 'Tracks user progress on hack checklist items';
COMMENT ON FUNCTION can_complete_hack IS 'Checks if a user can mark a hack as complete based on required checks';
COMMENT ON FUNCTION get_hack_check_progress IS 'Returns check completion statistics for a hack';