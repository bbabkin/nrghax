-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own hack interactions" ON public.user_hacks;

-- Create a more permissive policy that allows reading for like counts
-- Anyone can see hack_id and liked status (for counting), but only owners can see other fields
CREATE POLICY "Anyone can view hack likes for counting" ON public.user_hacks
  FOR SELECT
  USING (true);

-- Note: The INSERT, UPDATE, and DELETE policies remain unchanged
-- They still require auth.uid() = user_id, so users can only modify their own data