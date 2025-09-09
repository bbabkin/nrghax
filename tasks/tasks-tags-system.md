# Task List: Tags System

## Overview
Implement a tags system that syncs Discord roles with NRGhax, enabling personalized hack recommendations and admin content management. The system will create a seamless bridge between Discord and the web application while maintaining transparency for end users.

## Implementation Approach
- **Testing Strategy**: Test-after for UI components, TDD for sync logic and recommendation algorithms
- **Priority Order**: Database schema first, then Discord sync, followed by admin UI, and finally recommendation engine
- **Key Dependencies**: Supabase (database), Discord bot (already implemented), Next.js admin dashboard

## User Stories
1. **Discord User**: Automatic role-to-tag sync for personalized hack recommendations
2. **Admin**: Create and manage tags, assign to hacks, view user segments
3. **New Discord Member**: Questionnaire responses generate roles that sync as tags
4. **System**: Prevent duplicate tags and maintain data integrity

## Relevant Files
### Implementation Files
- `supabase/migrations/[timestamp]_create_tags_tables.sql` - Database schema
- `src/lib/tags/tagService.ts` - Core tag management logic
- `src/lib/tags/syncService.ts` - Discord-to-NRGhax sync service
- `src/lib/tags/recommendationEngine.ts` - Hack filtering and recommendations
- `src/app/admin/tags/page.tsx` - Admin tag management interface
- `src/app/admin/tags/[id]/page.tsx` - Tag detail and assignment page
- `src/app/admin/users/[id]/page.tsx` - Update to show user tags
- `src/components/hacks/HackCard.tsx` - Update to display tag pills
- `nrgbot/src/services/tagSyncService.ts` - Discord bot sync service

### Test Files
- `src/lib/tags/__tests__/tagService.test.ts` - Tag CRUD operations
- `src/lib/tags/__tests__/syncService.test.ts` - Sync logic tests
- `src/lib/tags/__tests__/recommendationEngine.test.ts` - Filtering algorithm tests
- `tests/e2e/tags-admin.spec.ts` - Admin interface E2E tests

### Configuration Files
- `.env.example` - Add any new environment variables if needed
- `src/types/database.ts` - Update with tag-related types

## Tasks

### Phase 1: Database Setup
- [ ] 1.1 Create Supabase migration for tags system
  - [ ] 1.1.1 Create `tags` table with unique name constraint
  - [ ] 1.1.2 Create `user_tags` junction table with source tracking
  - [ ] 1.1.3 Create `hack_tags` junction table
  - [ ] 1.1.4 Add indexes for performance (tag slugs, junction tables)
  - [ ] 1.1.5 Implement case-insensitive unique constraint on tag names
- [ ] 1.2 Update TypeScript types
  - [ ] 1.2.1 Define Tag, UserTag, and HackTag interfaces
  - [ ] 1.2.2 Update existing User and Hack types to include relations
- [ ] 1.3 Create database helper functions
  - [ ] 1.3.1 Function to generate URL-safe slugs from tag names
  - [ ] 1.3.2 Function to check tag uniqueness before insert

### Phase 2: Core Tag Service
- [ ] 2.1 Implement tag CRUD operations
  - [ ] 2.1.1 Create `createTag` function with duplicate prevention
  - [ ] 2.1.2 Create `getTag` and `getAllTags` functions
  - [ ] 2.1.3 Create `updateTag` function (admin only)
  - [ ] 2.1.4 Create `deleteTag` with soft delete option
- [ ] 2.2 Implement tag assignment functions
  - [ ] 2.2.1 Create `assignTagToHack` function
  - [ ] 2.2.2 Create `removeTagFromHack` function
  - [ ] 2.2.3 Create `bulkAssignTagsToHack` function
  - [ ] 2.2.4 Create `getHackTags` function
- [ ] 2.3 Implement user tag functions
  - [ ] 2.3.1 Create `assignTagToUser` with source tracking
  - [ ] 2.3.2 Create `removeTagFromUser` function
  - [ ] 2.3.3 Create `getUserTags` function
  - [ ] 2.3.4 Create `syncUserTags` for Discord updates

### Phase 3: Discord Integration
- [ ] 3.1 Update Discord bot for tag sync
  - [ ] 3.1.1 Add tag sync service to bot initialization
  - [ ] 3.1.2 Implement role change event listener
  - [ ] 3.1.3 Create initial sync function for all existing roles
  - [ ] 3.1.4 Add sync status logging
- [ ] 3.2 Implement sync service in web app
  - [ ] 3.2.1 Create `syncDiscordRolesToTags` function
  - [ ] 3.2.2 Handle role creation events from Discord
  - [ ] 3.2.3 Handle role deletion events (remove from users, keep tag)
  - [ ] 3.2.4 Implement retry logic for failed syncs
- [ ] 3.3 Create sync monitoring
  - [ ] 3.3.1 Add sync status to admin dashboard
  - [ ] 3.3.2 Create sync error handling and reporting
  - [ ] 3.3.3 Implement sync metrics tracking

### Phase 4: Admin Interface
- [ ] 4.1 Create tag management page
  - [ ] 4.1.1 Build tags list view with search and filters
  - [ ] 4.1.2 Add create new tag form with validation
  - [ ] 4.1.3 Implement edit tag functionality
  - [ ] 4.1.4 Add delete confirmation dialog
- [ ] 4.2 Create tag assignment interface
  - [ ] 4.2.1 Build hack selection interface
  - [ ] 4.2.2 Create tag assignment UI with multi-select
  - [ ] 4.2.3 Implement bulk operations for multiple hacks
  - [ ] 4.2.4 Add tag removal functionality
- [ ] 4.3 Update user management
  - [ ] 4.3.1 Display user tags in admin user detail page
  - [ ] 4.3.2 Show tag source (Discord/manual)
  - [ ] 4.3.3 Add manual tag assignment option for admins
- [ ] 4.4 Add access control
  - [ ] 4.4.1 Implement admin-only middleware for tag routes
  - [ ] 4.4.2 Add role-based permissions check
  - [ ] 4.4.3 Secure API endpoints

### Phase 5: Recommendation Engine
- [ ] 5.1 Implement hack filtering
  - [ ] 5.1.1 Create `getRecommendedHacks` function with AND logic
  - [ ] 5.1.2 Handle users with no tags (show all hacks)
  - [ ] 5.1.3 Optimize query performance with proper joins
  - [ ] 5.1.4 Add caching for frequently accessed recommendations
- [ ] 5.2 Update hack display
  - [ ] 5.2.1 Modify HackCard component to show tag pills
  - [ ] 5.2.2 Style tag pills with minimal design
  - [ ] 5.2.3 Position tags below hack image
- [ ] 5.3 Update user dashboard
  - [ ] 5.3.1 Replace current hack display with filtered recommendations
  - [ ] 5.3.2 Ensure real-time updates when tags change
  - [ ] 5.3.3 Add loading state for recommendation queries
- [ ] 5.4 Performance optimization
  - [ ] 5.4.1 Implement user tag caching in session
  - [ ] 5.4.2 Add database indexes for recommendation queries
  - [ ] 5.4.3 Implement pagination for large result sets

### Phase 6: Testing
- [ ] 6.1 Write unit tests
  - [ ] 6.1.1 Test tag CRUD operations
  - [ ] 6.1.2 Test duplicate prevention logic
  - [ ] 6.1.3 Test recommendation filtering algorithm
  - [ ] 6.1.4 Test sync service functions
- [ ] 6.2 Write integration tests
  - [ ] 6.2.1 Test Discord role to tag sync flow
  - [ ] 6.2.2 Test tag assignment to hacks
  - [ ] 6.2.3 Test recommendation engine with various tag combinations
- [ ] 6.3 Write E2E tests
  - [ ] 6.3.1 Test admin tag management workflow
  - [ ] 6.3.2 Test hack recommendation display
  - [ ] 6.3.3 Test sync status in admin dashboard
- [ ] 6.4 Performance testing
  - [ ] 6.4.1 Test recommendation query performance
  - [ ] 6.4.2 Test bulk tag operations
  - [ ] 6.4.3 Load test with many tags per user

### Phase 7: Polish & Documentation
- [ ] 7.1 Error handling
  - [ ] 7.1.1 Add user-friendly error messages
  - [ ] 7.1.2 Implement graceful degradation for sync failures
  - [ ] 7.1.3 Add error boundary for tag components
- [ ] 7.2 Security hardening
  - [ ] 7.2.1 Sanitize tag names from Discord
  - [ ] 7.2.2 Implement rate limiting for tag operations
  - [ ] 7.2.3 Add XSS prevention for tag display
- [ ] 7.3 Documentation
  - [ ] 7.3.1 Document tag sync process
  - [ ] 7.3.2 Create admin guide for tag management
  - [ ] 7.3.3 Document API endpoints
- [ ] 7.4 Monitoring setup
  - [ ] 7.4.1 Add logging for sync operations
  - [ ] 7.4.2 Create alerts for sync failures
  - [ ] 7.4.3 Set up metrics dashboard

## Testing Notes

### When to Use TDD
- Discord sync logic (critical for data integrity)
- Recommendation filtering algorithm (complex business logic)
- Tag uniqueness validation (data consistency)
- Permission checks (security-critical)

### When Testing After is Fine
- Admin UI components (straightforward CRUD)
- Tag pill display components (visual elements)
- Static configuration
- Simple database queries

## Success Criteria
- ✅ All Discord roles successfully sync as tags
- ✅ No duplicate tags created
- ✅ Hack recommendations correctly filter by ALL user tags
- ✅ Admin can manage tags and assignments efficiently
- ✅ Users see personalized content without knowing about tags
- ✅ Sync completes in under 5 seconds for 100 roles
- ✅ Recommendation queries return in under 200ms