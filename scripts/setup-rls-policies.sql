-- Enable RLS and create policies for public read access
-- Run this in local Supabase SQL editor or via psql

-- Profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Hacks table
ALTER TABLE hacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view all hacks" ON hacks
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert hacks" ON hacks
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
CREATE POLICY "Admins can update hacks" ON hacks
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
CREATE POLICY "Admins can delete hacks" ON hacks
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view all tags" ON tags
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- HackTags junction table
ALTER TABLE hack_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view hack tags" ON hack_tags
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage hack tags" ON hack_tags
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- UserHacks table (likes, completions)
ALTER TABLE user_hacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view user hack interactions" ON user_hacks
  FOR SELECT USING (true);
CREATE POLICY "Users can manage own hack interactions" ON user_hacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hack interactions" ON user_hacks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hack interactions" ON user_hacks
  FOR DELETE USING (auth.uid() = user_id);

-- UserTags table
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tags" ON user_tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tags" ON user_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON user_tags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON user_tags
  FOR DELETE USING (auth.uid() = user_id);

-- HackPrerequisites table
ALTER TABLE hack_prerequisites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view prerequisites" ON hack_prerequisites
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage prerequisites" ON hack_prerequisites
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));