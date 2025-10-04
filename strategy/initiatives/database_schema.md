# NRGHAX Database Schema SUGGESTIONS


## Overview
THIS IS NOT AN ACTUAL SCHEMA OF THE PLATFORM, MORE LIKE FOOD FOR THOUGHT

## Implementation Instructions for Agents

### Prerequisites
- Supabase project with PostgreSQL database
- Auth configured (email/password, Google OAuth, Discord OAuth)
- Understanding of Row Level Security (RLS) policies

### Implementation Order
1. Create tables in the order listed (respects foreign key dependencies)
2. Add indexes after table creation
3. Enable RLS policies
4. Create triggers and functions
5. Insert seed data last

### Key Design Principles
- UUID primary keys for all tables
- Soft deletes where appropriate (using status fields)
- JSONB for flexible/evolving data structures
- Timestamps for all user actions
- Foreign key constraints for data integrity

---

## 1. Core User System

### users
Extends Supabase auth.users with profile data.

```
Table: users
Primary Key: id (UUID, references auth.users)
Fields:
  - username (TEXT, UNIQUE) - chosen username
  - display_name (TEXT) - public display name
  - discord_id (TEXT, UNIQUE) - Discord user ID
  - discord_username (TEXT) - Discord username
  - discord_discriminator (TEXT) - Discord discriminator
  - avatar_url (TEXT) - profile picture URL
  - bio (TEXT) - user bio/description
  - timezone (TEXT) - user's timezone
  - privacy_settings (JSONB) - {"leaderboard_visible": bool, "profile_public": bool}
  - onboarding_completed (BOOLEAN, DEFAULT false)
  - selected_path (TEXT) - energy_awareness | protection | flow_master
  - graduation_status (TEXT, DEFAULT 'active') - active | graduated | alumni
  - graduated_at (TIMESTAMP WITH TIME ZONE)
  - created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
  - updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

Indexes:
  - discord_id
  - username
```

---

## 2. Hacks & Learning Content

### hack_categories
Categories for organizing hacks by type.

```
Table: hack_categories
Primary Key: id (UUID)
Fields:
  - name (TEXT, UNIQUE) - category identifier
  - description (TEXT)
  - icon_url (TEXT)
  - color_hex (TEXT) - for UI theming
  - sort_order (INTEGER, DEFAULT 0)
```

### hacks
Core library of energy techniques.

```
Table: hacks
Primary Key: id (UUID)
Fields:
  - name (TEXT, NOT NULL)
  - slug (TEXT, UNIQUE, NOT NULL) - URL-friendly identifier
  - description (TEXT) - full description
  - short_description (TEXT) - preview text
  - content_url (TEXT) - video/audio URL
  - text_guide (TEXT) - markdown instructions
  - duration_minutes (INTEGER)
  - category_id (UUID, FK -> hack_categories)
  - difficulty_level (INTEGER, 1-5)
  - prerequisite_hack_id (UUID, FK -> hacks, NULLABLE)
  - unlock_criteria (JSONB) - e.g., {"practice_count": 7, "days_active": 3}
  - requires_verification (BOOLEAN, DEFAULT false) - needs peer verification
  - verification_questions (JSONB) - questions for verification if required
    Example: ["How does it feel?", "When does it activate?", "What changes have you noticed?"]
  - is_gateway (BOOLEAN, DEFAULT false) - starter hack flag
  - is_active (BOOLEAN, DEFAULT true)
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - slug
  - category_id
  - is_gateway
  - requires_verification
```

### user_hack_progress
Tracks individual user progress on each hack.

```
Table: user_hack_progress
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - hack_id (UUID, FK -> hacks, NOT NULL)
  - unlocked_at (TIMESTAMP WITH TIME ZONE)
  - first_practiced_at (TIMESTAMP WITH TIME ZONE)
  - last_practiced_at (TIMESTAMP WITH TIME ZONE)
  - total_practice_count (INTEGER, DEFAULT 0)
  - total_practice_minutes (INTEGER, DEFAULT 0)
  - mastery_level (INTEGER, 0-5, DEFAULT 0)
  - is_favorite (BOOLEAN, DEFAULT false)
  - notes (TEXT)

Constraints:
  - UNIQUE(user_id, hack_id)

Indexes:
  - user_id
  - hack_id
  - user_id + mastery_level (for finding mastered hacks)
```

---

## 3. Practice & Tracking

### practice_sessions
Individual practice session records.

```
Table: practice_sessions
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - hack_id (UUID, FK -> hacks, NOT NULL)
  - started_at (TIMESTAMP WITH TIME ZONE)
  - ended_at (TIMESTAMP WITH TIME ZONE)
  - duration_seconds (INTEGER)
  - feedback_score (INTEGER) - -1 (bad) | 0 (neutral) | 1 (good)
  - notes (TEXT)
  - is_group_session (BOOLEAN, DEFAULT false)
  - session_type (TEXT) - solo | group | teaching | guided
  - biometric_data (JSONB) - optional HRV data
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - user_id + started_at
  - hack_id
  - session_type
```

### daily_checkins
Tracks daily engagement and streaks.

```
Table: daily_checkins
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - checkin_date (DATE, NOT NULL)
  - streak_count (INTEGER, DEFAULT 1)
  - selected_hack_id (UUID, FK -> hacks)
  - mood_before (INTEGER, 1-10)
  - mood_after (INTEGER, 1-10)
  - notes (TEXT)
  - created_at (TIMESTAMP WITH TIME ZONE)

Constraints:
  - UNIQUE(user_id, checkin_date)

Indexes:
  - user_id + checkin_date
```

### validations
Peer validation for practice sessions.

```
Table: validations
Primary Key: id (UUID)
Fields:
  - session_id (UUID, FK -> practice_sessions, NOT NULL)
  - validator_user_id (UUID, FK -> users, NOT NULL)
  - validation_type (TEXT) - authentic | helpful | inspiring
  - comment (TEXT)
  - created_at (TIMESTAMP WITH TIME ZONE)

Constraints:
  - UNIQUE(session_id, validator_user_id)

Indexes:
  - session_id
  - validator_user_id
```

---

## 4. Gamification & Achievements

### achievements
Achievement definitions.

```
Table: achievements
Primary Key: id (UUID)
Fields:
  - name (TEXT, UNIQUE, NOT NULL)
  - slug (TEXT, UNIQUE, NOT NULL)
  - description (TEXT)
  - icon_url (TEXT)
  - category (TEXT)
  - criteria_json (JSONB, NOT NULL) - {"type": "streak", "value": 7}
  - points (INTEGER, DEFAULT 10)
  - is_hidden (BOOLEAN, DEFAULT false)
  - discord_role_id (TEXT) - Discord role to assign
  - sort_order (INTEGER)
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - slug
  - category
```

### user_achievements
Tracks earned achievements.

```
Table: user_achievements
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - achievement_id (UUID, FK -> achievements, NOT NULL)
  - earned_at (TIMESTAMP WITH TIME ZONE)
  - progress_data (JSONB) - for partial progress

Constraints:
  - UNIQUE(user_id, achievement_id)

Indexes:
  - user_id
  - earned_at
```

### user_xp
XP tracking per category.

```
Table: user_xp
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - category_id (UUID, FK -> hack_categories)
  - xp_amount (INTEGER, DEFAULT 0)
  - level (INTEGER, DEFAULT 1)
  - updated_at (TIMESTAMP WITH TIME ZONE)

Constraints:
  - UNIQUE(user_id, category_id)

Indexes:
  - user_id
```

---

## 5. Challenges & Events

### challenges
Time-limited challenges.

```
Table: challenges
Primary Key: id (UUID)
Fields:
  - name (TEXT, NOT NULL)
  - slug (TEXT, UNIQUE, NOT NULL)
  - description (TEXT)
  - start_date (TIMESTAMP WITH TIME ZONE, NOT NULL)
  - end_date (TIMESTAMP WITH TIME ZONE, NOT NULL)
  - criteria_json (JSONB, NOT NULL)
  - reward_type (TEXT)
  - reward_value (JSONB)
  - max_participants (INTEGER)
  - is_active (BOOLEAN, DEFAULT true)
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - slug
  - is_active + start_date
```

### challenge_participants
Challenge participation tracking.

```
Table: challenge_participants
Primary Key: id (UUID)
Fields:
  - challenge_id (UUID, FK -> challenges, NOT NULL)
  - user_id (UUID, FK -> users, NOT NULL)
  - joined_at (TIMESTAMP WITH TIME ZONE)
  - completed_at (TIMESTAMP WITH TIME ZONE)
  - completion_data (JSONB)
  - rank (INTEGER)

Constraints:
  - UNIQUE(challenge_id, user_id)

Indexes:
  - challenge_id
  - user_id
```

### group_sessions
Scheduled group practice events.

```
Table: group_sessions
Primary Key: id (UUID)
Fields:
  - hack_id (UUID, FK -> hacks)
  - host_user_id (UUID, FK -> users)
  - scheduled_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
  - duration_minutes (INTEGER, DEFAULT 30)
  - max_participants (INTEGER)
  - description (TEXT)
  - discord_voice_channel_id (TEXT)
  - status (TEXT) - scheduled | active | completed | cancelled
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - scheduled_at
  - status
```

---

## 6. Hack Verification System

### hack_verifications
Hack mastery verification submissions for any hack requiring verification (shield, energy programming, etc.).

```
Table: hack_verifications
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - hack_id (UUID, FK -> hacks, NOT NULL)
  - verification_questions (JSONB, NOT NULL) - flexible Q&A structure
    Example for Shield: {
      "how_it_feels": "answer text",
      "when_it_activates": "answer text", 
      "changes_noticed": "answer text"
    }
  - is_anonymous (BOOLEAN, DEFAULT false)
  - submitted_at (TIMESTAMP WITH TIME ZONE)
  - verification_count (INTEGER, DEFAULT 0)
  - is_verified (BOOLEAN, DEFAULT false)
  - verified_at (TIMESTAMP WITH TIME ZONE)

Constraints:
  - UNIQUE(user_id, hack_id) - one verification per user per hack

Indexes:
  - user_id
  - hack_id
  - is_verified
```

### hack_verification_reviews
Peer reviews of hack verifications.

```
Table: hack_verification_reviews
Primary Key: id (UUID)
Fields:
  - verification_id (UUID, FK -> hack_verifications, NOT NULL)
  - reviewer_user_id (UUID, FK -> users, NOT NULL)
  - is_authentic (BOOLEAN, NOT NULL)
  - comment (TEXT)
  - reviewed_at (TIMESTAMP WITH TIME ZONE)

Constraints:
  - UNIQUE(verification_id, reviewer_user_id)

Indexes:
  - verification_id
  - reviewer_user_id
```

---

## 7. Community & Innovation

### hack_innovations
User-submitted hack variations.

```
Table: hack_innovations
Primary Key: id (UUID)
Fields:
  - original_hack_id (UUID, FK -> hacks, NOT NULL)
  - creator_user_id (UUID, FK -> users, NOT NULL)
  - name (TEXT, NOT NULL)
  - description (TEXT)
  - variation_content (TEXT)
  - submission_date (TIMESTAMP WITH TIME ZONE)
  - status (TEXT) - pending | testing | approved | rejected
  - approval_date (TIMESTAMP WITH TIME ZONE)
  - total_tests (INTEGER, DEFAULT 0)
  - average_rating (DECIMAL(3,2))

Indexes:
  - creator_user_id
  - status
```

### teaching_sessions
Peer teaching sessions.

```
Table: teaching_sessions
Primary Key: id (UUID)
Fields:
  - teacher_user_id (UUID, FK -> users, NOT NULL)
  - hack_id (UUID, FK -> hacks, NOT NULL)
  - scheduled_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
  - discord_voice_channel_id (TEXT)
  - max_students (INTEGER, DEFAULT 10)
  - description (TEXT)
  - status (TEXT) - scheduled | active | completed | cancelled
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - teacher_user_id
  - scheduled_at
```

### practice_buddies
Matched practice partners.

```
Table: practice_buddies
Primary Key: id (UUID)
Fields:
  - user1_id (UUID, FK -> users, NOT NULL)
  - user2_id (UUID, FK -> users, NOT NULL)
  - matched_at (TIMESTAMP WITH TIME ZONE)
  - discord_channel_id (TEXT)
  - practice_count (INTEGER, DEFAULT 0)
  - last_practice_at (TIMESTAMP WITH TIME ZONE)
  - status (TEXT) - active | inactive | completed

Constraints:
  - UNIQUE(user1_id, user2_id)
  - CHECK(user1_id != user2_id)

Indexes:
  - user1_id
  - user2_id
  - status
```

---

## 8. Referrals & Growth

### referrals
Referral tracking.

```
Table: referrals
Primary Key: id (UUID)
Fields:
  - referrer_user_id (UUID, FK -> users, NOT NULL)
  - referred_user_id (UUID, FK -> users, NULLABLE)
  - invite_code (TEXT, UNIQUE, NOT NULL)
  - created_at (TIMESTAMP WITH TIME ZONE)
  - used_at (TIMESTAMP WITH TIME ZONE)
  - is_active_referral (BOOLEAN, DEFAULT false)
  - activated_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - invite_code
  - referrer_user_id
```

---

## 9. Graduation & Liberation

### graduation_applications
Graduation process tracking.

```
Table: graduation_applications
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - applied_at (TIMESTAMP WITH TIME ZONE)
  - review_starts_at (TIMESTAMP WITH TIME ZONE)
  - status (TEXT) - pending | approved | needs_more_time
  - reviewer_notes (TEXT)
  - approved_at (TIMESTAMP WITH TIME ZONE)
  - certificate_url (TEXT)

Indexes:
  - user_id
  - status
```

### alumni_feedback
Post-graduation feedback.

```
Table: alumni_feedback
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - months_since_graduation (INTEGER)
  - still_practicing (BOOLEAN)
  - practice_frequency (TEXT)
  - helped_others_count (INTEGER)
  - success_story (TEXT)
  - suggestions (TEXT)
  - submitted_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - user_id
```

### spinoff_communities
Tracking spin-off communities.

```
Table: spinoff_communities
Primary Key: id (UUID)
Fields:
  - founder_user_id (UUID, FK -> users, NOT NULL)
  - name (TEXT, NOT NULL)
  - description (TEXT)
  - discord_server_id (TEXT)
  - website_url (TEXT)
  - member_count (INTEGER, DEFAULT 1)
  - founded_at (TIMESTAMP WITH TIME ZONE)
  - is_active (BOOLEAN, DEFAULT true)

Indexes:
  - founder_user_id
```

---

## 10. Analytics & Operations

### daily_metrics
Aggregated daily platform metrics.

```
Table: daily_metrics
Primary Key: id (UUID)
Fields:
  - metric_date (DATE, NOT NULL)
  - active_users (INTEGER, DEFAULT 0)
  - new_users (INTEGER, DEFAULT 0)
  - total_practice_minutes (INTEGER, DEFAULT 0)
  - total_sessions (INTEGER, DEFAULT 0)
  - validations_given (INTEGER, DEFAULT 0)
  - achievements_earned (INTEGER, DEFAULT 0)
  - graduations (INTEGER, DEFAULT 0)
  - created_at (TIMESTAMP WITH TIME ZONE)

Constraints:
  - UNIQUE(metric_date)

Indexes:
  - metric_date
```

### user_activity_logs
Detailed activity logging for analytics.

```
Table: user_activity_logs
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - activity_type (TEXT, NOT NULL)
  - activity_data (JSONB)
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - user_id + activity_type + created_at
```

### notifications
User notification queue.

```
Table: notifications
Primary Key: id (UUID)
Fields:
  - user_id (UUID, FK -> users, NOT NULL)
  - type (TEXT, NOT NULL)
  - title (TEXT)
  - message (TEXT)
  - data (JSONB)
  - is_read (BOOLEAN, DEFAULT false)
  - read_at (TIMESTAMP WITH TIME ZONE)
  - created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
  - user_id + is_read
  - created_at
```

---

## Important Implementation Notes

### 1. Row Level Security (RLS)
Enable RLS on all user-data tables:
- Users can only view/edit their own data
- Public leaderboards respect privacy settings
- Peer validations prevent self-validation

### 2. Triggers to Create
- `update_updated_at_column()` - Auto-update timestamps
- `calculate_streak()` - Auto-calculate streaks on checkin
- `check_hack_verification()` - Auto-verify hack after 3 authentic reviews
- `update_practice_progress()` - Update hack progress after sessions

### 3. Performance Considerations
- Create composite indexes for common query patterns
- Use JSONB for flexible data but index extracted fields
- Consider partitioning for activity_logs table at scale
- Cache aggregated metrics (daily_metrics table)

### 4. Data Validation
- Use CHECK constraints for enums (status fields)
- Foreign key constraints for referential integrity
- Unique constraints to prevent duplicates
- NOT NULL for required fields

### 5. Seed Data Required
```
Categories: energy_awareness, protection, flow_manipulation, relaxation, healing
Gateway Hacks: energy-ball, eye-massage, pain-unwind, warm-liquid
Verification-Required Hacks: double-torus-shield (protection), energy-programming (flow_manipulation)
Initial Achievements: first-steps, week-warrior, shield-bearer, energy-guide, liberation
```

### 6. Migration Strategy
1. Create all tables without foreign keys
2. Add foreign key constraints
3. Create indexes
4. Enable RLS
5. Create triggers and functions
6. Insert seed data
7. Run validation queries

### 7. Backup Considerations
- Daily backups of all user data
- Point-in-time recovery enabled
- Export functionality for GDPR compliance
- Regular testing of restore procedures

---

## Agent Implementation Checklist

When implementing this schema:

1. [ ] Set up Supabase project with auth configured
2. [ ] Create tables in dependency order
3. [ ] Add all foreign key relationships
4. [ ] Create indexes for query performance
5. [ ] Enable and configure RLS policies
6. [ ] Create necessary triggers and functions
7. [ ] Insert seed data (categories, gateway hacks, achievements)
8. [ ] Test all CRUD operations with RLS enabled
9. [ ] Verify cascade deletes work correctly
10. [ ] Set up automated backups
11. [ ] Create database documentation
12. [ ] Test migration and rollback procedures

## Questions to Ask Before Implementation

1. What is the expected user scale? (affects indexing strategy)
2. Which features are Phase 1 vs future? (affects initial schema)
3. What are the Discord bot's database permissions?
4. How will biometric data be handled for privacy?
5. What are the specific RLS policies needed?
6. Should we use database functions vs application logic?
7. What monitoring/alerting is needed for database health?

## Next Steps

1. Review schema with team for completeness
2. Create migration files in order
3. Set up development environment for testing
4. Create API endpoints for each table
5. Document API contracts
6. Create seed data scripts
7. Set up monitoring and analytics