# Task List: User Onboarding with Role Assignment

## Overview
Implement a unified onboarding experience that assigns roles based on user preferences and experience level. The system will establish the web app as the source of truth for roles, with bidirectional sync to Discord, and personalize content display based on assigned tags.

## Implementation Approach
- **Testing Strategy**: Mixed - TDD for role assignment logic and sync operations, test-after for UI components
- **Priority Order**: Database schema first, then onboarding flow, role assignment logic, Discord sync, and finally content personalization
- **Key Dependencies**: Supabase Auth, Discord bot API, existing tag system

## User Stories
1. **New User Onboarding**: Answer questions after signup to see relevant content (5-8 questions)
2. **Beginner Experience**: See introductory hacks first without overwhelming advanced content
3. **Expert Fast-Track**: Skip basic content and see advanced hacks matching expertise
4. **Discord Sync**: Web roles automatically sync with Discord for consistent experience
5. **Profile Updates**: Update preferences so content recommendations evolve with skills
6. **Skip Option**: Access platform with default beginner role when skipping onboarding

## Relevant Files
### Implementation Files
- `src/app/onboarding/page.tsx` - Onboarding wizard UI
- `src/components/onboarding/QuestionnaireWizard.tsx` - Multi-step questionnaire component
- `src/lib/tags/assignment.ts` - Role assignment logic based on answers
- `src/lib/tags/sync.ts` - Discord synchronization service
- `src/lib/tags/types.ts` - Tag type definitions and rules
- `src/app/api/discord/sync/route.ts` - Discord webhook endpoint
- `src/components/dashboard/PersonalizedContent.tsx` - Content recommendation component
- `src/app/profile/tags/page.tsx` - User tag management page

### Test Files
- `src/lib/tags/assignment.test.ts` - Unit tests for role assignment logic
- `src/lib/tags/sync.test.ts` - Discord sync logic tests
- `tests/e2e/onboarding.spec.ts` - End-to-end onboarding flow tests
- `supabase/tests/tag_management.sql` - Database tests for tag operations

### Configuration Files
- `.env.example` - Discord bot token and webhook URLs
- `supabase/migrations/[timestamp]_add_tag_system.sql` - Database schema changes

## Tasks

### Phase 1: Database Schema & Setup
- [ ] 1.1 Create database migration for tag system enhancements
  - [ ] 1.1.1 Add `tag_type` enum to tags table
  - [ ] 1.1.2 Add `discord_role_name` and `is_user_assignable` fields
  - [ ] 1.1.3 Extend `user_tags` with `updated_at` and `source` fields
  - [ ] 1.1.4 Create `tag_sync_log` table for tracking sync history
- [ ] 1.2 Write pgTAP tests for tag type enforcement and rules
- [ ] 1.3 Seed initial tags (beginner, intermediate, expert, interests)
- [ ] 1.4 Add Discord bot credentials to environment variables

### Phase 2: Onboarding Flow Implementation
- [ ] 2.1 Create onboarding route and page structure
- [ ] 2.2 Build QuestionnaireWizard component
  - [ ] 2.2.1 Implement multi-step wizard with progress indicator
  - [ ] 2.2.2 Add question components for each category
  - [ ] 2.2.3 Implement skip functionality with default role assignment
  - [ ] 2.2.4 Add mobile-responsive design
- [ ] 2.3 Create question data structure (5-8 questions)
  - [ ] 2.3.1 Experience level questions
  - [ ] 2.3.2 Interest area questions
  - [ ] 2.3.3 Learning goals questions
  - [ ] 2.3.4 Time commitment and difficulty preference

### Phase 3: Role Assignment Logic
- [ ] 3.1 Write TDD tests for role assignment algorithm
- [ ] 3.2 Implement role assignment service
  - [ ] 3.2.1 Parse questionnaire responses
  - [ ] 3.2.2 Apply tag_type rules (mutual exclusivity)
  - [ ] 3.2.3 Store assignments in user_tags table
  - [ ] 3.2.4 Handle skip scenario (assign beginner tag)
- [ ] 3.3 Create tag management utilities
  - [ ] 3.3.1 Tag validation functions
  - [ ] 3.3.2 Conflict resolution logic
  - [ ] 3.3.3 Tag update permissions

### Phase 4: Discord Synchronization
- [ ] 4.1 Write tests for bidirectional sync logic
- [ ] 4.2 Implement Discord sync service
  - [ ] 4.2.1 Web-to-Discord sync when tags change
  - [ ] 4.2.2 Discord-to-Web webhook handler
  - [ ] 4.2.3 Conflict resolution based on tag_type and timestamp
  - [ ] 4.2.4 Sync logging to tag_sync_log table
- [ ] 4.3 Create Discord bot commands for role updates
- [ ] 4.4 Add sync status indicators in user profile

### Phase 5: Content Personalization
- [ ] 5.1 Update homepage to show tag-relevant hacks
- [ ] 5.2 Build PersonalizedContent dashboard component
  - [ ] 5.2.1 Fetch user tags from context
  - [ ] 5.2.2 Query hacks matching user interests and experience
  - [ ] 5.2.3 Add visual indicators for recommended content
- [ ] 5.3 Update hack listing with tag filtering
- [ ] 5.4 Implement recommendation algorithm
  - [ ] 5.4.1 Match interest tags with hack content tags
  - [ ] 5.4.2 Filter by appropriate experience level
  - [ ] 5.4.3 Handle users with no tags (show all content)

### Phase 6: User Profile & Tag Management
- [ ] 6.1 Create tag management page in user profile
  - [ ] 6.1.1 Display current tags as badges
  - [ ] 6.1.2 Add "Retake Questionnaire" button
  - [ ] 6.1.3 Show tag assignment source and timestamp
- [ ] 6.2 Build admin tag management interface
  - [ ] 6.2.1 Manual tag assignment/removal
  - [ ] 6.2.2 Bulk operations for user tags
  - [ ] 6.2.3 Tag analytics and usage stats

### Phase 7: Testing & Polish
- [ ] 7.1 Write E2E tests for complete onboarding flow
- [ ] 7.2 Test Discord sync in both directions
- [ ] 7.3 Verify content personalization accuracy
- [ ] 7.4 Test edge cases
  - [ ] 7.4.1 Network failures during sync
  - [ ] 7.4.2 Conflicting tag assignments
  - [ ] 7.4.3 Missing Discord connection
- [ ] 7.5 Performance optimization
  - [ ] 7.5.1 Cache user tags in session
  - [ ] 7.5.2 Optimize recommendation queries
  - [ ] 7.5.3 Lazy load personalized content

### Phase 8: Documentation & Deployment
- [ ] 8.1 Update API documentation for Discord sync endpoints
- [ ] 8.2 Document tag type rules and assignment logic
- [ ] 8.3 Create user guide for profile tag management
- [ ] 8.4 Verify all environment variables are set
- [ ] 8.5 Run full test suite before deployment

## Testing Notes

### When to Use TDD
- Role assignment algorithm (complex business logic)
- Discord sync operations (multiple states and edge cases)
- Tag type enforcement and conflict resolution
- Database operations with RLS policies

### When Testing After is Fine
- Onboarding UI components (straightforward React components)
- Visual elements like badges and progress bars
- Static question content
- Admin interface (mostly CRUD operations)

## Success Criteria
- 70% of new users complete onboarding questionnaire
- 95% successful role sync rate between web and Discord
- 30% increase in hack completion rate for users with assigned roles
- Less than 1% role conflict issues reported
- All tests passing with >80% coverage for critical paths