# Task List: Learning Materials (Hacks) Feature

## Overview
Build a comprehensive learning materials system where admins can create educational content modules ("hacks") that users can access, complete, and engage with through likes. The system tracks prerequisites, completion history, and user engagement while supporting both internal content and external links.

## Implementation Approach
- **Testing Strategy**: Mixed approach - TDD for business logic (prerequisites, completion tracking), test-after for UI components
- **Priority Order**: Database schema first, then admin CRUD, followed by user viewing/interaction features
- **Key Dependencies**: Supabase (auth, database, storage), Tiptap editor for rich text content, shadcn/ui components

## User Stories

1. **Admin creates hack** - Admin can create learning material with name, description, image, and either internal content or external link
   - Acceptance: Form validates exclusive content/link, saves to database, handles image upload

2. **Admin manages prerequisites** - Admin can set multiple prerequisite hacks for any hack
   - Acceptance: UI shows existing hacks, prevents circular dependencies, saves relationships

3. **User views hacks** - User sees available hacks with visual indicators for prerequisites and completion
   - Acceptance: Grid/list displays all hacks, shows lock for incomplete prerequisites, completion checkmarks

4. **User completes hack** - Visiting a hack automatically marks it as completed
   - Acceptance: Database records completion timestamp, updates UI immediately

5. **User likes/unlikes** - User can toggle like status on any hack
   - Acceptance: Like count updates, user's like status persists, can unlike previously liked

## Relevant Files

### Implementation Files
- `src/app/admin/hacks/page.tsx` - Admin dashboard for managing hacks
- `src/app/admin/hacks/new/page.tsx` - Create new hack form
- `src/app/admin/hacks/[id]/edit/page.tsx` - Edit existing hack
- `src/app/hacks/page.tsx` - Public hacks listing page
- `src/app/hacks/[id]/page.tsx` - Individual hack view/content page
- `src/app/profile/history/page.tsx` - User's completion history
- `src/components/hacks/HackCard.tsx` - Reusable hack display card
- `src/components/hacks/HackForm.tsx` - Reusable form for create/edit
- `src/components/hacks/PrerequisiteSelector.tsx` - Multi-select for prerequisites
- `src/lib/hacks/actions.ts` - Server actions for CRUD operations
- `src/lib/hacks/utils.ts` - Helper functions (prerequisite validation, etc.)

### Test Files
- `src/lib/hacks/utils.test.ts` - Unit tests for business logic
- `tests/e2e/hacks-admin.spec.ts` - Admin CRUD flow tests
- `tests/e2e/hacks-user.spec.ts` - User interaction tests

### Configuration Files
- `supabase/migrations/[timestamp]_create_hacks_tables.sql` - Database schema
- `.env.example` - Add any new environment variables if needed

## Tasks

### Phase 1: Database Setup
- [ ] 1.1 Create database migration for hacks schema
  - [ ] 1.1.1 Create `hacks` table with all required fields
  - [ ] 1.1.2 Create `hack_prerequisites` junction table
  - [ ] 1.1.3 Create `user_hack_completions` table
  - [ ] 1.1.4 Create `user_hack_likes` table
- [ ] 1.2 Set up RLS (Row Level Security) policies
  - [ ] 1.2.1 Admin-only policies for hack creation/editing
  - [ ] 1.2.2 Public read access for hacks
  - [ ] 1.2.3 User-specific policies for completions and likes
- [ ] 1.3 Create database functions
  - [ ] 1.3.1 Function to check prerequisite completion
  - [ ] 1.3.2 Function to validate circular dependencies
  - [ ] 1.3.3 Function to cascade delete related data

### Phase 2: Admin Features
- [ ] 2.1 Install and configure Tiptap editor
  - [ ] 2.1.1 Add @tiptap/react and necessary extensions
  - [ ] 2.1.2 Create reusable RichTextEditor component
- [ ] 2.2 Build hack creation form
  - [ ] 2.2.1 Create HackForm component with all fields
  - [ ] 2.2.2 Implement content/link toggle logic
  - [ ] 2.2.3 Add image upload to Supabase Storage
  - [ ] 2.2.4 Create PrerequisiteSelector component
- [ ] 2.3 Implement admin CRUD operations
  - [ ] 2.3.1 Create server action for creating hacks
  - [ ] 2.3.2 Create server action for updating hacks
  - [ ] 2.3.3 Create server action for deleting hacks
  - [ ] 2.3.4 Add prerequisite validation logic
- [ ] 2.4 Build admin dashboard
  - [ ] 2.4.1 Create admin hacks listing page
  - [ ] 2.4.2 Add edit/delete buttons with proper authorization
  - [ ] 2.4.3 Implement new hack page
  - [ ] 2.4.4 Implement edit hack page

### Phase 3: User Features
- [ ] 3.1 Create public hacks listing
  - [ ] 3.1.1 Build HackCard component
  - [ ] 3.1.2 Implement grid/list layout
  - [ ] 3.1.3 Show like count and completion status
  - [ ] 3.1.4 Add prerequisite lock indicators
- [ ] 3.2 Implement hack viewing
  - [ ] 3.2.1 Create individual hack page
  - [ ] 3.2.2 Handle external link redirection (new tab)
  - [ ] 3.2.3 Display internal content with proper formatting
  - [ ] 3.2.4 Check and enforce prerequisites
- [ ] 3.3 Add completion tracking
  - [ ] 3.3.1 Auto-mark as complete on visit
  - [ ] 3.3.2 Store completion timestamp
  - [ ] 3.3.3 Update UI to reflect completion
- [ ] 3.4 Implement like system
  - [ ] 3.4.1 Create like/unlike server actions
  - [ ] 3.4.2 Add optimistic UI updates
  - [ ] 3.4.3 Display current user's like status
  - [ ] 3.4.4 Show total like count
- [ ] 3.5 Build user history page
  - [ ] 3.5.1 Create completion history view
  - [ ] 3.5.2 Show completion timestamps
  - [ ] 3.5.3 Add filtering/sorting options

### Phase 4: Testing
- [ ] 4.1 Write unit tests for business logic
  - [ ] 4.1.1 Test prerequisite validation
  - [ ] 4.1.2 Test circular dependency detection
  - [ ] 4.1.3 Test completion tracking logic
- [ ] 4.2 Create integration tests
  - [ ] 4.2.1 Test database operations
  - [ ] 4.2.2 Test RLS policies
  - [ ] 4.2.3 Test cascade deletions
- [ ] 4.3 Write E2E tests
  - [ ] 4.3.1 Test admin CRUD workflow
  - [ ] 4.3.2 Test user hack completion flow
  - [ ] 4.3.3 Test prerequisite enforcement
  - [ ] 4.3.4 Test like/unlike functionality

### Phase 5: Polish & Edge Cases
- [ ] 5.1 Add loading states and skeletons
- [ ] 5.2 Implement error handling
  - [ ] 5.2.1 Handle failed image uploads
  - [ ] 5.2.2 Handle database errors gracefully
  - [ ] 5.2.3 Add user-friendly error messages
- [ ] 5.3 Optimize performance
  - [ ] 5.3.1 Add pagination for large hack lists
  - [ ] 5.3.2 Optimize prerequisite checking queries
  - [ ] 5.3.3 Implement image lazy loading
- [ ] 5.4 Ensure responsive design
  - [ ] 5.4.1 Test and fix mobile layouts
  - [ ] 5.4.2 Ensure touch-friendly interactions
- [ ] 5.5 Add accessibility features
  - [ ] 5.5.1 Proper ARIA labels
  - [ ] 5.5.2 Keyboard navigation support

## Testing Notes

### When to Use TDD
- Prerequisite validation logic (complex business rules)
- Circular dependency detection algorithm
- Completion tracking logic
- Server action data validation

### When Testing After is Fine
- UI components (HackCard, forms)
- Layout and styling
- Tiptap editor integration
- Image upload functionality

## Success Criteria
- Admins can successfully create, edit, and delete hacks with all specified fields
- Users can view hacks with clear prerequisite indicators
- Completion tracking works automatically on hack visit
- Like/unlike functionality persists and updates in real-time
- User history accurately shows all completed hacks with timestamps (multiple visit friendly)
- External links open in new tabs, internal content displays properly
- System prevents access to hacks with incomplete prerequisites
- No circular dependencies can be created in prerequisites
- All features work on mobile devices