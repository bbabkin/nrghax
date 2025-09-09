# Product Requirements Document: Tags System

## Introduction/Overview

The tags system serves as a bridge between Discord roles and the NRGhax application, enabling personalized hack recommendations and resource organization. By syncing Discord roles as tags, the system maintains consistency across platforms while providing admins with tools to curate content effectively. This feature enhances user experience through targeted content delivery without exposing complexity to end users.

## Goals

1. Create seamless synchronization between Discord roles and NRGhax tags
2. Enable personalized hack recommendations based on user tags
3. Provide admins with tools to organize and tag content
4. Maintain simplicity with a flat tag structure
5. Establish foundation for future bidirectional sync capabilities

## User Stories

1. **As a Discord user**, I want my server roles to automatically translate into personalized hack recommendations so that I see relevant content.
2. **As an admin**, I want to create and manage tags so that I can organize content and users effectively.
3. **As an admin**, I want to assign multiple tags to hacks so that they appear in appropriate filtered views.
4. **As a new Discord member**, I want my questionnaire responses to generate roles that sync as tags for personalized content.
5. **As an admin**, I want to view user tags in the dashboard so that I can understand user segments.
6. **As a system**, I want to prevent duplicate tags so that the tag system remains clean and manageable.

## Functional Requirements

### Database Schema
1. The system must create a `tags` table with fields: id, name, slug, created_at, updated_at, created_by
2. The system must create a `user_tags` junction table with fields: user_id, tag_id, assigned_at, source (discord/manual)
3. The system must create a `hack_tags` junction table with fields: hack_id, tag_id, assigned_at, assigned_by
4. The system must enforce unique tag names (case-insensitive) to prevent duplicates
5. The system must generate URL-safe slugs from tag names

### Discord Integration
6. The system must sync all Discord roles as tags during initial setup
7. The system must detect new Discord roles and create corresponding tags automatically
8. The system must sync user Discord roles to user_tags when users link accounts
9. The system must update user tags when Discord roles change
10. The system must handle role deletions by removing corresponding user_tags (but keep the tag)

### Admin Management
11. The system must provide admin interface to create new tags
12. The system must provide admin interface to assign tags to hacks
13. The system must display user tags in the admin dashboard user details page
14. The system must prevent non-admin users from creating or modifying tags
15. The system must allow admins to bulk assign tags to multiple hacks

### Hack Recommendations
16. The system must filter hacks based on ALL user tags (AND logic)
17. The system must show recommended hacks on user dashboard based on their tags
18. The system must display hack tags as pills below hack images
19. The system must exclude hacks that don't match all user tags from recommendations
20. The system must handle users with no tags by showing all hacks

### User Experience
21. The system must NOT display tags to users on their NRGhax profile
22. The system must apply tags transparently without user awareness
23. The system must ensure hack recommendations update immediately when tags change
24. The system must maintain consistent tag naming between Discord and NRGhax

## Non-Goals (Out of Scope)

- User-created tags
- Tag hierarchies or categories
- Tag colors, icons, or visual customization
- User ability to self-assign tags in NRGhax
- Tag-based XP or progression modifications
- Tag moderation workflow
- Public display of user tags
- Tag-based achievements or quests
- Backward sync from NRGhax tags to Discord roles (future phase)
- Migration of existing categories to tags

## Design Considerations

### Tag Display
- Tags appear as simple text pills below hack images
- No visual styling beyond basic pill shape
- Tags visible only in admin dashboard for user management
- Clean, minimal presentation without colors or icons

### Sync Behavior
- One-way sync from Discord to NRGhax (initially)
- Real-time or near-real-time synchronization
- Graceful handling of sync failures
- Conflict resolution favors existing tags over creating duplicates

## Technical Considerations

### Database Design
- Use lowercase comparison for tag uniqueness
- Index tag slugs for efficient queries
- Implement soft delete for tags to maintain referential integrity
- Use transactions for bulk tag operations

### Performance
- Cache user tags in session/memory for recommendation queries
- Implement efficient queries for AND-based filtering
- Consider pagination for users with many tags
- Optimize hack recommendation queries with proper indexes

### Sync Architecture
- Use Discord bot events for role change detection
- Implement queue system for bulk sync operations
- Add retry logic for failed sync attempts
- Log all sync operations for debugging

### Security
- Validate tag names to prevent XSS
- Implement rate limiting for tag operations
- Ensure only admins can access tag management endpoints
- Sanitize tag names from Discord before storage

## Success Metrics

1. **Sync Reliability**: 99.9% successful Discord role to tag synchronization
2. **Recommendation Accuracy**: Users see only hacks matching all their tags
3. **Performance**: Hack filtering completes in under 200ms
4. **Data Integrity**: Zero duplicate tags created
5. **Admin Efficiency**: Bulk tagging operations complete in under 5 seconds
6. **User Experience**: Seamless hack recommendations without user awareness of tags

## Open Questions

1. How should the system handle Discord role renames - create new tag or update existing?
2. What's the maximum number of tags a user can have before performance degrades?
3. Should there be a default set of tags for users with no Discord roles?
4. How should the system handle archived/deleted hacks with tags?
5. Should tag sync be triggered on-demand or run periodically?
6. What logging level is needed for sync operations?
7. Should admins be able to manually override Discord-synced tags?
8. How should the system handle special Discord roles like @everyone?
9. What happens to tags if Discord integration is disconnected?
10. Should there be an audit trail for tag assignments and changes?