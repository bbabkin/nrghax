-- Seed initial tags for onboarding system
-- This file should be run after the migration

-- Insert user experience level tags (mutually exclusive)
INSERT INTO public.tags (name, slug, tag_type, is_user_assignable, display_order, description, discord_role_name)
VALUES
    ('Beginner', 'beginner', 'user_experience', true, 1,
     'New to cybersecurity and hacking', 'Beginner'),
    ('Intermediate', 'intermediate', 'user_experience', true, 2,
     'Some experience with security concepts and tools', 'Intermediate'),
    ('Expert', 'expert', 'user_experience', true, 3,
     'Advanced knowledge and practical experience', 'Expert')
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Insert user interest tags (can have multiple)
INSERT INTO public.tags (name, slug, tag_type, is_user_assignable, display_order, description, discord_role_name)
VALUES
    ('Web Security', 'web-security', 'user_interest', true, 10,
     'Interest in web application security, XSS, SQL injection, etc.', 'Web Security'),
    ('Binary Exploitation', 'binary-exploitation', 'user_interest', true, 11,
     'Interest in reverse engineering, buffer overflows, ROP chains', 'Binary Exploitation'),
    ('Cryptography', 'cryptography', 'user_interest', true, 12,
     'Interest in encryption, hashing, cryptanalysis', 'Cryptography'),
    ('Network Security', 'network-security', 'user_interest', true, 13,
     'Interest in network protocols, packet analysis, pentesting', 'Network Security'),
    ('Cloud Security', 'cloud-security', 'user_interest', true, 14,
     'Interest in cloud infrastructure, containers, Kubernetes security', 'Cloud Security'),
    ('Mobile Security', 'mobile-security', 'user_interest', true, 15,
     'Interest in Android/iOS security, mobile app pentesting', 'Mobile Security'),
    ('Hardware Hacking', 'hardware-hacking', 'user_interest', true, 16,
     'Interest in IoT, embedded systems, physical security', 'Hardware Hacking'),
    ('OSINT', 'osint', 'user_interest', true, 17,
     'Interest in open source intelligence and reconnaissance', 'OSINT'),
    ('Forensics', 'forensics', 'user_interest', true, 18,
     'Interest in digital forensics and incident response', 'Forensics'),
    ('Malware Analysis', 'malware-analysis', 'user_interest', true, 19,
     'Interest in analyzing and understanding malicious software', 'Malware Analysis')
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Insert special user tags (admin-managed only)
INSERT INTO public.tags (name, slug, tag_type, is_user_assignable, display_order, description, discord_role_name)
VALUES
    ('Mentor', 'mentor', 'user_special', false, 50,
     'Community mentor who helps other users', 'Mentor'),
    ('Contributor', 'contributor', 'user_special', false, 51,
     'Active contributor to challenges and content', 'Contributor'),
    ('Verified', 'verified', 'user_special', false, 52,
     'Verified security researcher or professional', 'Verified'),
    ('Beta Tester', 'beta-tester', 'user_special', false, 53,
     'Beta tester for new features and challenges', 'Beta Tester')
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Insert content tags for hacks (not user-assignable)
INSERT INTO public.tags (name, slug, tag_type, is_user_assignable, display_order, description)
VALUES
    -- Difficulty tags
    ('Easy', 'easy', 'content', false, 100,
     'Suitable for beginners'),
    ('Medium', 'medium', 'content', false, 101,
     'Requires some experience'),
    ('Hard', 'hard', 'content', false, 102,
     'Challenging for experienced users'),
    ('Insane', 'insane', 'content', false, 103,
     'Extremely difficult challenges'),

    -- Topic tags (matching user interests for content matching)
    ('Web', 'web', 'content', false, 110,
     'Web application challenges'),
    ('Binary', 'binary', 'content', false, 111,
     'Binary exploitation challenges'),
    ('Crypto', 'crypto', 'content', false, 112,
     'Cryptography challenges'),
    ('Network', 'network', 'content', false, 113,
     'Network security challenges'),
    ('Cloud', 'cloud', 'content', false, 114,
     'Cloud security challenges'),
    ('Mobile', 'mobile', 'content', false, 115,
     'Mobile security challenges'),
    ('Hardware', 'hardware', 'content', false, 116,
     'Hardware hacking challenges'),
    ('OSINT Challenge', 'osint-challenge', 'content', false, 117,
     'OSINT challenges'),
    ('Forensics Challenge', 'forensics-challenge', 'content', false, 118,
     'Forensics challenges'),
    ('Malware', 'malware', 'content', false, 119,
     'Malware analysis challenges'),

    -- Learning path tags
    ('CTF Prep', 'ctf-prep', 'content', false, 120,
     'Good for CTF preparation'),
    ('Bug Bounty', 'bug-bounty', 'content', false, 121,
     'Relevant for bug bounty hunting'),
    ('Certification', 'certification', 'content', false, 122,
     'Helps with security certifications'),

    -- Time commitment tags
    ('Quick', 'quick', 'content', false, 130,
     'Can be completed in under 30 minutes'),
    ('Long', 'long', 'content', false, 131,
     'Requires significant time investment')
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;