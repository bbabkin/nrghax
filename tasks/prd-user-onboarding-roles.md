# Product Requirements Document: User Onboarding with Role Assignment

## Introduction/Overview

This feature introduces a unified onboarding experience for web users that assigns roles based on user preferences, qualities, and requirements. These roles will determine content personalization and access permissions, creating consistency with the existing Discord role system. The web application will serve as the source of truth for role assignments, automatically syncing with Discord when accounts are connected.

## Goals

1. Create a seamless onboarding flow that categorizes new users based on their experience level, interests, and goals
2. Establish the web application as the primary source of truth for user roles across platforms
3. Automatically sync assigned roles with Discord when users connect their accounts
4. Personalize content display to show the most relevant hacks based on user roles
5. Reduce cognitive overload for beginners while providing advanced content for experienced users

## User Stories

1. **As a new user**, I want to answer a few questions after signup so that I see content relevant to my skill level and interests
2. **As a beginner**, I want to see introductory hacks first so that I don't feel overwhelmed by advanced content
3. **As an experienced user**, I want to skip basic content and see advanced hacks that match my expertise
4. **As a Discord user**, I want my web roles to automatically sync with Discord so that I have a consistent experience across platforms
5. **As a returning user**, I want to update my preferences so that my content recommendations evolve with my skills
6. **As a user who skips onboarding**, I want to still access the platform with a default beginner role so that I can explore at my own pace

## Functional Requirements

1. **Onboarding Questionnaire**
   - The system must present an onboarding questionnaire after user registration
   - The questionnaire must contain 5-8 questions covering experience level, interests, and goals
   - Each question must have multiple choice answers with clear descriptions
   - The system must allow users to skip the onboarding (assigning default "beginner" role)

2. **Role/Tag Assignment Logic**
   - The system must analyze questionnaire responses to assign appropriate tags
   - The system must support multiple tag assignments per user
   - The system must store tag assignments in the `user_tags` table (junction between users and tags)
   - Each tag must have a `tag_type` to indicate its category and mutual exclusivity rules
   - The system must assign a "beginner" tag to users who skip onboarding

3. **Discord Synchronization**
   - The system must implement bidirectional tag synchronization between web and Discord
   - The system must track tag assignment timestamps and sources to determine precedence
   - When a user connects Discord: merge tags from both platforms based on tag_type rules
   - The system must update Discord roles via the bot when tags change on the web
   - The system must update web tags when Discord roles change (webhook/bot notification)
   - Conflict resolution strategy based on `tag_type`:
     - `user_experience` tags (mutually exclusive): use most recent assignment
     - `user_interest` tags: union of both platforms (user can have multiple)
     - `user_special` tags: admin-assigned always take precedence
     - `content` tags: only for hacks, not synced with Discord
   - The system must maintain a `tag_sync_log` table to track synchronization history

4. **Content Personalization**
   - The homepage must display hacks that match the user's tags
   - The dashboard must show recommended hacks based on user tags
   - The hacks listing page must highlight tag-relevant content
   - The system must show all hacks to users with no tags assigned
   - Content matching logic: hacks with tags that match user's interest tags AND appropriate for user's experience level tag

5. **Tag Management**
   - Users must be able to view their assigned tags in their profile
   - Users must be able to retake the onboarding questionnaire to update tags
   - Admins must be able to manually assign/remove tags via the admin panel
   - The system must enforce tag_type rules (e.g., only one user_experience tag at a time)
   - The system must track tag assignment source (onboarding, discord, admin, system)

6. **Question Categories**
   - Experience level (beginner, intermediate, advanced)
   - Areas of interest (web security, binary exploitation, cryptography, networking, etc.)
   - Learning goals (capture the flag, bug bounty, professional development, hobby)
   - Time commitment (casual, regular, intensive)
   - Preferred difficulty (easy start, challenging, mixed)

## Non-Goals (Out of Scope)

- Custom role creation by users
- Role-based access to specific features (except admin features)
- Gamification or badges system
- Role prerequisites or progression paths
- Integration with platforms other than Discord
- Modification of existing Discord bot functionality
- Changes to the existing authentication system
- Role-based pricing or payment tiers

## Design Considerations

1. **UI/UX Requirements**
   - Onboarding should use a multi-step wizard with progress indicator
   - Questions should be visually engaging with icons or illustrations
   - Mobile-responsive design for all onboarding screens
   - Clear "Skip" option visible on each step
   - Smooth transitions between questions

2. **Visual Feedback**
   - Display assigned roles as badges on user profile
   - Show role tags on recommended hacks
   - Visual indicators for content matching user roles
   - Progress bar during onboarding

## Technical Considerations

1. **Database**
   - Extend existing `tags` table with:
     - `tag_type` (enum: 'user_experience', 'user_interest', 'user_special', 'content')
     - `discord_role_name` (text) - for mapping to Discord roles
     - `is_user_assignable` (boolean) - whether tag can be assigned to users
   - Extend `user_tags` junction table with:
     - `updated_at` (timestamp) for conflict resolution
     - `source` (enum: 'onboarding', 'discord', 'admin', 'system')
   - Create `tag_sync_log` table to track sync operations
   - Tag types and rules:
     - `user_experience` (mutually exclusive): beginner, intermediate, expert
     - `user_interest` (can have multiple): web-security, binary, cryptography, networking
     - `user_special` (admin-managed): mentor, contributor, verified
     - `content` (for hacks only): difficulty levels, topics, prerequisites
   - Single `tags` table serves both users and hacks, differentiated by tag_type

2. **Integration Points**
   - Supabase Auth for user authentication
   - Discord bot API for role synchronization
   - Existing tag system for role representation

3. **Performance**
   - Cache user roles in session/context to avoid repeated database queries
   - Optimize hack recommendation queries with proper indexes
   - Lazy load personalized content on dashboard

## Success Metrics

1. **Engagement Metrics**
   - 70% of new users complete the onboarding questionnaire
   - 30% increase in hack completion rate for users with assigned roles
   - 25% reduction in bounce rate on the homepage

2. **User Satisfaction**
   - 80% of users find recommended content relevant (via feedback survey)
   - 50% reduction in support tickets asking "where do I start?"
   - 40% increase in average session duration

3. **Platform Consistency**
   - 95% successful role sync rate between web and Discord
   - Less than 1% role conflict issues reported
   - 90% of Discord users connect their web accounts

## Open Questions

1. Should role assignments expire or require periodic revalidation?
2. What specific role names and descriptions should we use?
3. Should we track which onboarding questions lead to which role assignments for analytics?
4. How should we handle users who want to remove all roles?
5. Should there be a maximum number of roles per user?
6. What happens if Discord role names change - how do we maintain sync?
7. Should we notify users when their Discord roles are updated from the web app?
8. For bidirectional sync: should we show users a "sync conflict" UI to manually resolve conflicts?
9. Should certain roles be "locked" to one platform only (e.g., Discord-only moderator roles)?