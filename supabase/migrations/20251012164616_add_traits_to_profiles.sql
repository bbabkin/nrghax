-- Add traits column to profiles table
-- Traits are similar to Discord roles and will be synced between the two platforms
-- Each trait is a text string identifier (e.g., 'beginner', 'energy-focused', 'early-riser')

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS traits TEXT[] DEFAULT '{}';

-- Create index for traits array for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_traits ON profiles USING GIN (traits);

-- Add comment to document the column
COMMENT ON COLUMN profiles.traits IS 'User traits/roles assigned through onboarding and other sources. Similar to Discord roles and will be synced bidirectionally.';

-- Migrate existing user_tags data to traits
-- This converts tag slugs into trait strings
UPDATE profiles p
SET traits = COALESCE(
  (
    SELECT array_agg(DISTINCT t.slug)
    FROM user_tags ut
    JOIN tags t ON t.id = ut.tag_id
    WHERE ut.user_id = p.id
      AND ut.source = 'onboarding'
  ),
  '{}'::TEXT[]
)
WHERE EXISTS (
  SELECT 1
  FROM user_tags ut
  WHERE ut.user_id = p.id
    AND ut.source = 'onboarding'
);
