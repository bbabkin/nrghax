-- Production Database Setup Script
-- Run this in Supabase Dashboard SQL Editor
-- This will create all necessary tables and seed data

-- Clean up existing tables if they exist (BE CAREFUL - THIS DROPS EXISTING DATA)
DROP TABLE IF EXISTS public.onboarding_responses CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.tag_sync_log CASCADE;
DROP TABLE IF EXISTS public.user_tags CASCADE;
DROP TABLE IF EXISTS public.hack_tags CASCADE;
DROP TABLE IF EXISTS public.hack_prerequisites CASCADE;
DROP TABLE IF EXISTS public.user_hack_completions CASCADE;
DROP TABLE IF EXISTS public.user_hack_likes CASCADE;
DROP TABLE IF EXISTS public.hacks CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS public.tag_type CASCADE;
DROP TYPE IF EXISTS public.tag_source CASCADE;

-- Create profiles table first
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  onboarding_completed boolean default false,
  discord_id text unique,
  discord_username text,
  discord_roles text[],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ENUMs
CREATE TYPE public.tag_type AS ENUM (
    'user_experience',
    'user_interest',
    'user_special',
    'content'
);

CREATE TYPE public.tag_source AS ENUM (
    'web',
    'discord',
    'onboarding'
);

-- Create tags table
CREATE TABLE public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    tag_type public.tag_type DEFAULT 'content',
    tag_source public.tag_source DEFAULT 'web',
    is_user_assignable BOOLEAN DEFAULT true,
    discord_role_id TEXT UNIQUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_tags table
CREATE TABLE public.user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    source public.tag_source DEFAULT 'web',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, tag_id)
);

-- Create tag_sync_log table
CREATE TABLE public.tag_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('add', 'remove')) NOT NULL,
    source public.tag_source NOT NULL,
    target TEXT CHECK (target IN ('web', 'discord')) NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Create questions table
CREATE TABLE public.questions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
    category TEXT NOT NULL CHECK (category IN ('experience', 'interests', 'goals', 'time', 'difficulty')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Create question_options table
CREATE TABLE public.question_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(question_id, value)
);

-- Create onboarding_responses table
CREATE TABLE public.onboarding_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer JSONB,
    answer_value TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, question_id)
);

-- Create hacks table
CREATE TABLE public.hacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    category TEXT,
    points INTEGER DEFAULT 10,
    content TEXT,
    link TEXT,
    image TEXT,
    instructions JSONB DEFAULT '[]'::jsonb,
    hints JSONB DEFAULT '[]'::jsonb,
    resources JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    content_type TEXT CHECK (content_type IN ('text', 'video', 'interactive', 'external')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT content_xor_link CHECK (
        (content IS NOT NULL AND link IS NULL) OR
        (content IS NULL AND link IS NOT NULL) OR
        (content IS NULL AND link IS NULL)
    ),
    CONSTRAINT hacks_image_check CHECK (
        image IS NULL OR
        image ~ '^https?://' OR
        image ~ '^/'
    )
);

-- Create hack_tags table
CREATE TABLE public.hack_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(hack_id, tag_id)
);

-- Create hack_prerequisites table
CREATE TABLE public.hack_prerequisites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    prerequisite_hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(hack_id, prerequisite_hack_id),
    CONSTRAINT no_self_prerequisite CHECK (hack_id != prerequisite_hack_id)
);

-- Create user_hack_completions table
CREATE TABLE public.user_hack_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    time_spent INTEGER,
    notes TEXT,
    UNIQUE(user_id, hack_id)
);

-- Create user_hack_likes table
CREATE TABLE public.user_hack_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hack_id UUID NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, hack_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hack_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hack_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hack_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hack_likes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_profiles_discord_id ON public.profiles(discord_id);
CREATE INDEX idx_profiles_discord_roles ON public.profiles USING GIN(discord_roles);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_tags_tag_type ON public.tags(tag_type);
CREATE INDEX idx_tags_discord_role_id ON public.tags(discord_role_id);
CREATE INDEX idx_tags_is_user_assignable ON public.tags(is_user_assignable);
CREATE INDEX idx_tags_name_lower ON public.tags(LOWER(name));
CREATE UNIQUE INDEX tags_name_unique_idx ON public.tags(LOWER(name));
CREATE UNIQUE INDEX tags_slug_unique_idx ON public.tags(LOWER(slug));
CREATE INDEX idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX idx_user_tags_tag_id ON public.user_tags(tag_id);
CREATE INDEX idx_user_tags_updated_at ON public.user_tags(updated_at);
CREATE INDEX idx_tag_sync_log_user_id ON public.tag_sync_log(user_id);
CREATE INDEX idx_tag_sync_log_created_at ON public.tag_sync_log(created_at);
CREATE INDEX idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX idx_question_options_sort_order ON public.question_options(sort_order);
CREATE INDEX idx_questions_sort_order ON public.questions(sort_order);
CREATE INDEX idx_questions_is_active ON public.questions(is_active);
CREATE INDEX idx_onboarding_responses_user_id ON public.onboarding_responses(user_id);
CREATE INDEX idx_hack_tags_hack_id ON public.hack_tags(hack_id);
CREATE INDEX idx_hack_tags_tag_id ON public.hack_tags(tag_id);
CREATE INDEX idx_hack_prerequisites_hack_id ON public.hack_prerequisites(hack_id);
CREATE INDEX idx_hack_prerequisites_prerequisite_hack_id ON public.hack_prerequisites(prerequisite_hack_id);
CREATE INDEX idx_user_hack_completions_user_id ON public.user_hack_completions(user_id);
CREATE INDEX idx_user_hack_completions_hack_id ON public.user_hack_completions(hack_id);
CREATE INDEX idx_user_hack_likes_user_id ON public.user_hack_likes(user_id);
CREATE INDEX idx_user_hack_likes_hack_id ON public.user_hack_likes(hack_id);

-- Create trigger function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is first user (auto-admin)
CREATE OR REPLACE FUNCTION public.is_first_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RETURN user_count = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and set first admin
CREATE OR REPLACE FUNCTION public.check_and_set_first_admin()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    IF user_count = 1 THEN
        UPDATE public.profiles SET is_admin = true WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set first user as admin
DROP TRIGGER IF EXISTS check_first_admin_after_insert ON public.profiles;
CREATE TRIGGER check_first_admin_after_insert
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_and_set_first_admin();

-- Add RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can update Discord fields" ON public.profiles
    FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- Add RLS policies for tags
CREATE POLICY "Tags are viewable by everyone" ON public.tags
    FOR SELECT USING (true);

CREATE POLICY "Only admins can create tags" ON public.tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can update tags" ON public.tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can delete tags" ON public.tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Add RLS policies for questions
CREATE POLICY "Questions are viewable by everyone" ON public.questions
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert questions" ON public.questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can update questions" ON public.questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can delete questions" ON public.questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Add RLS policies for question_options
CREATE POLICY "Question options are viewable by everyone" ON public.question_options
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert question options" ON public.question_options
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can update question options" ON public.question_options
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Only admins can delete question options" ON public.question_options
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Insert default questions
INSERT INTO public.questions (id, title, description, type, category, sort_order) VALUES
('experience_level', 'What''s your experience level with cybersecurity?', 'This helps us recommend challenges that match your current skills.', 'single', 'experience', 1),
('interest_areas', 'Which areas interest you the most?', 'Select all that apply. We''ll recommend relevant challenges.', 'multiple', 'interests', 2),
('learning_goals', 'What are your main learning goals?', 'This helps us understand what you want to achieve.', 'multiple', 'goals', 3),
('time_commitment', 'How much time can you dedicate to learning?', 'We''ll recommend challenges that fit your schedule.', 'single', 'time', 4),
('preferred_difficulty', 'How do you prefer to learn?', 'Choose your preferred difficulty progression.', 'single', 'difficulty', 5);

-- Insert question options
INSERT INTO public.question_options (question_id, value, label, description, icon, sort_order) VALUES
('experience_level', 'beginner', 'Beginner', 'New to cybersecurity, learning the basics', '🌱', 1),
('experience_level', 'intermediate', 'Intermediate', 'Some experience with security concepts and tools', '🚀', 2),
('experience_level', 'expert', 'Expert', 'Advanced knowledge and practical experience', '⭐', 3),
('interest_areas', 'web-security', 'Web Security', 'XSS, SQL injection, CSRF, etc.', '🌐', 1),
('interest_areas', 'binary-exploitation', 'Binary Exploitation', 'Buffer overflows, ROP chains, reverse engineering', '💾', 2),
('interest_areas', 'cryptography', 'Cryptography', 'Encryption, hashing, cryptanalysis', '🔐', 3),
('interest_areas', 'network-security', 'Network Security', 'Protocols, packet analysis, pentesting', '🔌', 4),
('interest_areas', 'cloud-security', 'Cloud Security', 'Cloud infrastructure, containers, Kubernetes', '☁️', 5),
('interest_areas', 'mobile-security', 'Mobile Security', 'Android/iOS security, mobile app pentesting', '📱', 6),
('learning_goals', 'ctf-prep', 'CTF Preparation', 'Prepare for Capture The Flag competitions', '🏁', 1),
('learning_goals', 'bug-bounty', 'Bug Bounty', 'Learn skills for bug bounty hunting', '🐛', 2),
('learning_goals', 'professional', 'Professional Development', 'Advance my cybersecurity career', '💼', 3),
('learning_goals', 'hobby', 'Personal Interest', 'Learning for fun and curiosity', '🎯', 4),
('time_commitment', 'casual', 'Casual', 'A few hours per week', '🐢', 1),
('time_commitment', 'regular', 'Regular', '1-2 hours daily', '🏃', 2),
('time_commitment', 'intensive', 'Intensive', 'Several hours daily', '🔥', 3),
('preferred_difficulty', 'easy_start', 'Start Easy', 'Begin with simple challenges and gradually increase difficulty', '📈', 1),
('preferred_difficulty', 'challenging', 'Jump into Challenges', 'Prefer challenging problems from the start', '⚡', 2),
('preferred_difficulty', 'mixed', 'Mixed Approach', 'A balance of easy and difficult challenges', '⚖️', 3);

-- Insert default tags
INSERT INTO public.tags (name, slug, description, tag_type, is_user_assignable) VALUES
-- Experience tags (mutually exclusive)
('Beginner', 'beginner', 'New to cybersecurity', 'user_experience', true),
('Intermediate', 'intermediate', 'Some experience with security', 'user_experience', true),
('Advanced', 'advanced', 'Experienced security practitioner', 'user_experience', true),
('Expert', 'expert', 'Security expert with deep knowledge', 'user_experience', true),

-- Interest tags (can have multiple)
('Web Security', 'web-security', 'Interested in web application security', 'user_interest', true),
('Binary Exploitation', 'binary-exploitation', 'Interested in binary and reverse engineering', 'user_interest', true),
('Cryptography', 'cryptography', 'Interested in cryptographic challenges', 'user_interest', true),
('Network Security', 'network-security', 'Interested in network and protocol security', 'user_interest', true),
('Cloud Security', 'cloud-security', 'Interested in cloud and container security', 'user_interest', true),
('Mobile Security', 'mobile-security', 'Interested in mobile application security', 'user_interest', true),
('OSINT', 'osint', 'Interested in open source intelligence', 'user_interest', true),
('Forensics', 'forensics', 'Interested in digital forensics', 'user_interest', true),

-- Special tags
('Mentor', 'mentor', 'Available to help other members', 'user_special', false),
('Contributor', 'contributor', 'Active content contributor', 'user_special', false),
('Beta Tester', 'beta-tester', 'Tests new features and provides feedback', 'user_special', false),

-- Content tags
('Tutorial', 'tutorial', 'Educational content', 'content', true),
('CTF Challenge', 'ctf-challenge', 'Capture The Flag challenge', 'content', true),
('Real World', 'real-world', 'Based on real vulnerabilities', 'content', true),
('Hands-on Lab', 'hands-on-lab', 'Interactive practical exercise', 'content', true);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Message for completion
DO $$
BEGIN
  RAISE NOTICE 'Production database setup complete!';
  RAISE NOTICE 'Tables created: profiles, tags, user_tags, questions, question_options, onboarding_responses, hacks, and related tables';
  RAISE NOTICE 'Default questions and tags have been inserted';
  RAISE NOTICE 'RLS policies are in place';
  RAISE NOTICE 'The first user to sign up will automatically be an admin';
END $$;