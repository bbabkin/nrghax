# Product Requirements Document: Learning Materials (Hacks) Feature

## Introduction/Overview

The Learning Materials (Hacks) feature enables administrators to create educational content modules called "hacks" that users can access, complete, and track their learning progress. Each hack represents a discrete learning unit that can either contain internal content or link to external resources. The system tracks user engagement through likes and completion history, creating a personalized learning experience.

## Goals

1. Enable administrators to create and manage learning materials (hacks)
2. Allow users to access and complete learning materials in a structured way
3. Track user progress and engagement with learning materials
4. Enforce prerequisite learning paths to ensure proper knowledge progression
5. Provide user engagement metrics through likes

## User Stories

1. **As an admin**, I want to create a new hack with a name, description, image, and either content or external link, so that I can provide learning materials to users.

2. **As an admin**, I want to set prerequisite hacks for new content, so that users follow a proper learning sequence.

3. **As an admin**, I want to edit or delete existing hacks, so that I can maintain and update the learning content.

4. **As a regular user**, I want to view available hacks, so that I can learn new topics.

5. **As a regular user**, I want to see which prerequisites I need to complete before accessing certain hacks, so that I understand the learning path.

6. **As a regular user**, I want to like/unlike hacks, so that I can show my appreciation for valuable content.

7. **As a regular user**, I want to see my completion history, so that I can track my learning progress.

## Functional Requirements

1. **Hack Creation (Admin)**
   - The system must allow admins to create hacks with the following fields:
     - Name (required, text)
     - Description (required, text)
     - Image (required, upload/URL)
     - Content type: either internal content OR external link (required, mutually exclusive)
     - Prerequisite hacks (optional, can select multiple existing hacks)

2. **Hack Management (Admin)**
   - The system must allow admins to edit all fields of existing hacks
   - The system must allow admins to delete hacks
   - The system must handle deletion of hacks that are prerequisites for other hacks

3. **Hack Display (All Users)**
   - The system must display a list/grid of all available hacks
   - The system must show hack details: name, description, image
   - The system must indicate if a hack has prerequisites
   - The system must show which prerequisites are not yet completed

4. **Hack Access (Regular Users)**
   - The system must allow users to access hacks with completed prerequisites
   - The system must redirect(new tab) users to external links when hack type is "link"
   - The system must display internal content when hack type is "content"
   - The system must prevent access to hacks with incomplete prerequisites

5. **Completion Tracking**
   - The system must automatically mark a hack as completed when a user visits it
   - The system must store completion timestamp for each user-hack combination
   - The system must maintain a completion history for each user

6. **Like System**
   - The system must allow users to like a hack
   - The system must allow users to unlike a previously liked hack
   - The system must display the total number of likes for each hack
   - The system must indicate if the current user has liked a hack

7. **User History**
   - The system must display a user's completed hacks
   - The system must show completion dates/times

## Non-Goals (Out of Scope)

1. Categories or tags for organizing hacks
2. Learning paths or curriculum structure
3. Comments or discussion features
4. Gamification elements (badges, points, leaderboards)
5. Search and filter functionality
6. Analytics dashboard for admins
7. Minimum time requirements for completion
8. Manual marking of hacks as incomplete
9. Progress tracking (partially completed hacks)
10. Content versioning or revision history

## Design Considerations

- **Hack List View**: Card-based layout showing hack image, name, description, like count, and completion status
- **Hack Detail View**: Full-screen view for internal content, or immediate redirect for external links
- **Prerequisites Indicator**: Visual indicator (lock icon, grayed out, etc.) for hacks with incomplete prerequisites
- **Like Button**: Heart icon or similar, with filled/unfilled states
- **Admin Interface**: Form-based creation/editing with image upload capability. Tiptap editor with common formatting tools for content editing.
- **Responsive Design**: Mobile-friendly layout for all views

## Technical Considerations

1. **Database Schema**:
   - Hacks table: id, name, description, image_url, content_type, content_body, external_link, created_at, updated_at
   - Prerequisites table: hack_id, prerequisite_hack_id
   - User_completions table: user_id, hack_id, completed_at
   - User_likes table: user_id, hack_id, created_at

2. **Authentication**: 
   - Integrate with existing Supabase Auth system
   - Role-based access control for admin features

3. **Image Handling**:
   - Support for image uploads to Supabase Storage
   - Or allow external image URLs

4. **Content Storage**:
   - Store internal content as Markdown or rich text in database
   - Validate that either content_body OR external_link is provided, not both

5. **Performance**:
   - Efficient queries for checking prerequisites
   - Caching strategy for frequently accessed hacks

## Success Metrics

1. Number of hacks created by admins
2. Percentage of users who complete at least one hack
3. Average number of hacks completed per user
4. Engagement rate (likes per hack view)
5. Completion rate for hacks with prerequisites vs. without

## Open Questions

1. Should there be a maximum number of prerequisites a hack can have? no
2. What happens to user completion history when a hack is deleted? cascade
3. Should external link hacks open in a new tab or same window? new tab
4. Is there a maximum file size for uploaded images? 3mb
5. Should prerequisite relationships be validated to prevent circular dependencies? sure
6. Do we need to track which admin created/modified each hack? no