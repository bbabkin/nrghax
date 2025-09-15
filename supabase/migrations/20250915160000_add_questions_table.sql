-- Create questions table for onboarding
CREATE TABLE IF NOT EXISTS public.questions (
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
CREATE TABLE IF NOT EXISTS public.question_options (
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

-- Add foreign key constraint to onboarding_responses
ALTER TABLE public.onboarding_responses
DROP CONSTRAINT IF EXISTS onboarding_responses_question_id_fkey;

ALTER TABLE public.onboarding_responses
ADD CONSTRAINT onboarding_responses_question_id_fkey
FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

-- Insert default questions
INSERT INTO public.questions (id, title, description, type, category, sort_order) VALUES
('experience_level', 'What''s your experience level with cybersecurity?', 'This helps us recommend challenges that match your current skills.', 'single', 'experience', 1),
('interest_areas', 'Which areas interest you the most?', 'Select all that apply. We''ll recommend relevant challenges.', 'multiple', 'interests', 2),
('learning_goals', 'What are your main learning goals?', 'This helps us understand what you want to achieve.', 'multiple', 'goals', 3),
('time_commitment', 'How much time can you dedicate to learning?', 'We''ll recommend challenges that fit your schedule.', 'single', 'time', 4),
('preferred_difficulty', 'How do you prefer to learn?', 'Choose your preferred difficulty progression.', 'single', 'difficulty', 5);

-- Insert question options
-- Experience level options
INSERT INTO public.question_options (question_id, value, label, description, icon, sort_order) VALUES
('experience_level', 'beginner', 'Beginner', 'New to cybersecurity, learning the basics', '🌱', 1),
('experience_level', 'intermediate', 'Intermediate', 'Some experience with security concepts and tools', '🚀', 2),
('experience_level', 'expert', 'Expert', 'Advanced knowledge and practical experience', '⭐', 3);

-- Interest areas options
INSERT INTO public.question_options (question_id, value, label, description, icon, sort_order) VALUES
('interest_areas', 'web-security', 'Web Security', 'XSS, SQL injection, CSRF, etc.', '🌐', 1),
('interest_areas', 'binary-exploitation', 'Binary Exploitation', 'Buffer overflows, ROP chains, reverse engineering', '💾', 2),
('interest_areas', 'cryptography', 'Cryptography', 'Encryption, hashing, cryptanalysis', '🔐', 3),
('interest_areas', 'network-security', 'Network Security', 'Protocols, packet analysis, pentesting', '🔌', 4),
('interest_areas', 'cloud-security', 'Cloud Security', 'Cloud infrastructure, containers, Kubernetes', '☁️', 5),
('interest_areas', 'mobile-security', 'Mobile Security', 'Android/iOS security, mobile app pentesting', '📱', 6);

-- Learning goals options
INSERT INTO public.question_options (question_id, value, label, description, icon, sort_order) VALUES
('learning_goals', 'ctf-prep', 'CTF Preparation', 'Prepare for Capture The Flag competitions', '🏁', 1),
('learning_goals', 'bug-bounty', 'Bug Bounty', 'Learn skills for bug bounty hunting', '🐛', 2),
('learning_goals', 'professional', 'Professional Development', 'Advance my cybersecurity career', '💼', 3),
('learning_goals', 'hobby', 'Personal Interest', 'Learning for fun and curiosity', '🎯', 4);

-- Time commitment options
INSERT INTO public.question_options (question_id, value, label, description, icon, sort_order) VALUES
('time_commitment', 'casual', 'Casual', 'A few hours per week', '🐢', 1),
('time_commitment', 'regular', 'Regular', '1-2 hours daily', '🏃', 2),
('time_commitment', 'intensive', 'Intensive', 'Several hours daily', '🔥', 3);

-- Difficulty preference options
INSERT INTO public.question_options (question_id, value, label, description, icon, sort_order) VALUES
('preferred_difficulty', 'easy_start', 'Start Easy', 'Begin with simple challenges and gradually increase difficulty', '📈', 1),
('preferred_difficulty', 'challenging', 'Jump into Challenges', 'Prefer challenging problems from the start', '⚡', 2),
('preferred_difficulty', 'mixed', 'Mixed Approach', 'A balance of easy and difficult challenges', '⚖️', 3);

-- Create indexes for better performance
CREATE INDEX idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX idx_question_options_sort_order ON public.question_options(sort_order);
CREATE INDEX idx_questions_sort_order ON public.questions(sort_order);
CREATE INDEX idx_questions_is_active ON public.questions(is_active);

-- Add RLS policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

-- Questions are publicly readable
CREATE POLICY "Questions are viewable by everyone" ON public.questions
    FOR SELECT USING (true);

-- Only admins can modify questions
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

-- Question options are publicly readable
CREATE POLICY "Question options are viewable by everyone" ON public.question_options
    FOR SELECT USING (true);

-- Only admins can modify question options
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_questions_updated_at();

CREATE TRIGGER trigger_update_question_options_updated_at
    BEFORE UPDATE ON public.question_options
    FOR EACH ROW
    EXECUTE FUNCTION update_questions_updated_at();