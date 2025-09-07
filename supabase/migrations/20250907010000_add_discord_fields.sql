-- Add Discord-related fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_id text UNIQUE,
ADD COLUMN IF NOT EXISTS discord_username text,
ADD COLUMN IF NOT EXISTS discord_roles text[] DEFAULT '{}';

-- Create index for faster Discord ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON public.profiles(discord_id);

-- Create index for discord_roles array
CREATE INDEX IF NOT EXISTS idx_profiles_discord_roles ON public.profiles USING GIN(discord_roles);

-- Update RLS policies to allow service role to update Discord fields
CREATE POLICY "Service role can update Discord fields"
  ON public.profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to sync Discord user with profile
CREATE OR REPLACE FUNCTION public.upsert_discord_profile(
  p_discord_id text,
  p_discord_username text,
  p_discord_roles text[] DEFAULT '{}'
)
RETURNS public.profiles AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  -- Try to update existing profile with this Discord ID
  UPDATE public.profiles
  SET 
    discord_username = p_discord_username,
    discord_roles = p_discord_roles,
    updated_at = NOW()
  WHERE discord_id = p_discord_id
  RETURNING * INTO v_profile;
  
  -- If no profile exists with this Discord ID, create one
  IF v_profile IS NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      discord_id,
      discord_username,
      discord_roles,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      COALESCE(p_discord_username || '@discord.local', 'unknown@discord.local'),
      p_discord_id,
      p_discord_username,
      p_discord_roles,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_profile;
  END IF;
  
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.upsert_discord_profile TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.discord_id IS 'Discord user ID for linking Discord account';
COMMENT ON COLUMN public.profiles.discord_username IS 'Discord username for display purposes';
COMMENT ON COLUMN public.profiles.discord_roles IS 'Array of Discord role names synced from Discord server';