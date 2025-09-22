-- Add onboarded column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- Update existing users to be marked as onboarded if they have tags
UPDATE profiles p
SET onboarded = true
WHERE EXISTS (
  SELECT 1
  FROM user_tags ut
  WHERE ut.user_id = p.id
  AND ut.source = 'onboarding'
);