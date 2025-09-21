-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE content_type AS ENUM ('content', 'link');
CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'text');
CREATE TYPE tag_source AS ENUM ('web', 'discord', 'onboarding', 'admin', 'system');
CREATE TYPE tag_type AS ENUM ('user_experience', 'user_interest', 'user_special', 'content');
CREATE TYPE user_hack_status AS ENUM ('interested', 'liked', 'visited');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create hacks table
CREATE TABLE public.hacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  image_path TEXT,
  content_type TEXT DEFAULT 'content',
  content_body TEXT,
  external_link TEXT,
  difficulty TEXT,
  time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tag_type TEXT DEFAULT 'hack',
  description TEXT,
  category TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_hacks table
CREATE TABLE public.user_hacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT false,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  status TEXT, -- deprecated
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hack_id)
);

-- Create hack_prerequisites table
CREATE TABLE public.hack_prerequisites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  prerequisite_hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hack_id, prerequisite_hack_id)
);

-- Create hack_tags table
CREATE TABLE public.hack_tags (
  hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(hack_id, tag_id)
);

-- Create user_tags table
CREATE TABLE public.user_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag_id)
);

-- Create routines table
CREATE TABLE public.routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  image_path TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create routine_hacks table
CREATE TABLE public.routine_hacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
  hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, hack_id)
);

-- Create routine_tags table
CREATE TABLE public.routine_tags (
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(routine_id, tag_id)
);

-- Create user_routines table
CREATE TABLE public.user_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT false,
  started BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, routine_id)
);

-- Create indexes for better performance
CREATE INDEX idx_hacks_slug ON public.hacks(slug);
CREATE INDEX idx_hacks_created_by ON public.hacks(created_by);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_user_hacks_user_id ON public.user_hacks(user_id);
CREATE INDEX idx_user_hacks_hack_id ON public.user_hacks(hack_id);
CREATE INDEX idx_routines_slug ON public.routines(slug);
CREATE INDEX idx_routines_created_by ON public.routines(created_by);
CREATE INDEX idx_user_routines_user_id ON public.user_routines(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hacks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_hacks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_routines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hack_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hack_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- RLS Policies for hacks
CREATE POLICY "Hacks are viewable by everyone" ON public.hacks
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create hacks" ON public.hacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own hacks" ON public.hacks
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any hack" ON public.hacks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can delete their own hacks" ON public.hacks
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any hack" ON public.hacks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for tags
CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage tags" ON public.tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for user_hacks
CREATE POLICY "Users can view their own hack interactions" ON public.user_hacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hack interactions" ON public.user_hacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hack interactions" ON public.user_hacks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hack interactions" ON public.user_hacks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hack_prerequisites
CREATE POLICY "Prerequisites are viewable by everyone" ON public.hack_prerequisites
  FOR SELECT USING (true);

CREATE POLICY "Only hack owners and admins can manage prerequisites" ON public.hack_prerequisites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hacks
      WHERE id = hack_id AND created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for hack_tags
CREATE POLICY "Hack tags are viewable by everyone" ON public.hack_tags
  FOR SELECT USING (true);

CREATE POLICY "Only hack owners and admins can manage hack tags" ON public.hack_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hacks
      WHERE id = hack_id AND created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for user_tags
CREATE POLICY "Users can view their own tags" ON public.user_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON public.user_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.user_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.user_tags
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for routines
CREATE POLICY "Public routines are viewable by everyone" ON public.routines
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own routines" ON public.routines
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own routines" ON public.routines
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own routines" ON public.routines
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for routine_hacks
CREATE POLICY "Routine hacks are viewable for accessible routines" ON public.routine_hacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE id = routine_id AND (is_public = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage hacks in their routines" ON public.routine_hacks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE id = routine_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for routine_tags
CREATE POLICY "Routine tags are viewable for accessible routines" ON public.routine_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE id = routine_id AND (is_public = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage tags in their routines" ON public.routine_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE id = routine_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for user_routines
CREATE POLICY "Users can view their own routine progress" ON public.user_routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track their own routine progress" ON public.user_routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine progress" ON public.user_routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine progress" ON public.user_routines
  FOR DELETE USING (auth.uid() = user_id);

-- Create views for common queries
CREATE VIEW public.hack_details AS
SELECT
  h.*,
  p.name as creator_name,
  p.avatar_url as creator_avatar,
  COUNT(DISTINCT uh.user_id) FILTER (WHERE uh.liked = true) as likes_count,
  COUNT(DISTINCT uh.user_id) FILTER (WHERE uh.viewed = true) as views_count
FROM public.hacks h
LEFT JOIN public.profiles p ON h.created_by = p.id
LEFT JOIN public.user_hacks uh ON h.id = uh.hack_id
GROUP BY h.id, p.name, p.avatar_url;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;