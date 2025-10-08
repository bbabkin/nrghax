# Comments Components

React components for displaying and managing comments on hacks and routines.

## Components

### CommentSection

Main container component that displays all comments for a given entity.

**Features:**
- Displays comment form at the top
- Lists all top-level comments with nested replies
- "Load more" pagination
- Empty state for no comments
- Requires authentication to post
- Automatic refresh on comment create/edit/delete

**Props:**
```typescript
interface CommentSectionProps {
  entityType: 'hack' | 'routine';
  entityId: string;
  videoRef?: React.RefObject<{
    getCurrentTime: () => number;
    seekTo: (time: number) => void
  }>;
}
```

**Usage:**
```tsx
import { CommentSection } from '@/components/comments';

export default function HackPage({ hackId }: { hackId: string }) {
  const videoRef = useRef(null);

  return (
    <div>
      <VideoPlayer ref={videoRef} />
      <CommentSection
        entityType="hack"
        entityId={hackId}
        videoRef={videoRef}
      />
    </div>
  );
}
```

### CommentThread

Displays a single comment with its nested replies.

**Features:**
- User avatar and name
- Relative timestamp (e.g., "2 hours ago")
- "Edited" indicator
- Timestamp badge (clickable to seek video)
- Like button with count
- Reply button (shows form inline)
- Edit/Delete buttons (owner only)
- Nested replies display
- Optimistic UI updates for likes

**Props:**
```typescript
interface CommentThreadProps {
  comment: Comment;
  entityType: 'hack' | 'routine';
  entityId: string;
  currentUserId?: string;
  videoRef?: React.RefObject<{
    getCurrentTime: () => number;
    seekTo: (time: number) => void
  }>;
  onUpdate?: () => void;
}
```

### CommentForm

Form for creating new comments or replies.

**Features:**
- Textarea for comment content
- Optional timestamp input (for video comments)
- "Capture" button to grab current video time
- Submit/Cancel buttons
- Validation and error handling
- Loading states

**Props:**
```typescript
interface CommentFormProps {
  entityType: 'hack' | 'routine';
  entityId: string;
  parentId?: string; // For replies
  videoRef?: React.RefObject<{ getCurrentTime: () => number }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
}
```

## Example Usage

### Basic Comments Section (No Video)
```tsx
import { CommentSection } from '@/components/comments';

export default function RoutinePage({ routineId }: { routineId: string }) {
  return (
    <div className="container mx-auto py-8">
      <h1>Routine Details</h1>
      {/* Routine content */}

      <div className="mt-12">
        <CommentSection
          entityType="routine"
          entityId={routineId}
        />
      </div>
    </div>
  );
}
```

### Comments with Video Timestamps
```tsx
'use client';

import { useRef } from 'react';
import { CommentSection } from '@/components/comments';
import VideoPlayer from '@/components/ui/VideoPlayer';

export default function HackPage({ hack }: { hack: Hack }) {
  const videoRef = useRef<{ getCurrentTime: () => number; seekTo: (time: number) => void }>(null);

  return (
    <div className="container mx-auto py-8">
      <h1>{hack.name}</h1>

      {hack.media_url && (
        <VideoPlayer
          ref={videoRef}
          url={hack.media_url}
          thumbnail={hack.media_thumbnail_url}
        />
      )}

      <div className="mt-12">
        <CommentSection
          entityType="hack"
          entityId={hack.id}
          videoRef={videoRef}
        />
      </div>
    </div>
  );
}
```

### Standalone Comment Form
```tsx
import { CommentForm } from '@/components/comments';

export default function CustomCommentBox({ hackId }: { hackId: string }) {
  const handleSuccess = () => {
    console.log('Comment posted!');
    // Refresh your data
  };

  return (
    <CommentForm
      entityType="hack"
      entityId={hackId}
      placeholder="Add your thoughts..."
      buttonText="Post"
      onSuccess={handleSuccess}
    />
  );
}
```

## Features

### Authentication
- Unauthenticated users can view comments
- Must be signed in to post, like, edit, or delete
- Users can only edit/delete their own comments
- Admins can hard delete any comment

### Video Timestamps
- When videoRef is provided, users can add timestamps to comments
- Timestamp badge is clickable and seeks to that time in the video
- Format: MM:SS (e.g., "2:45")

### Like System
- Optimistic UI updates (instant feedback)
- Toggle like/unlike with single click
- Shows count of likes

### Nested Replies
- Reply button opens inline form
- Replies are visually indented
- Support for one level of nesting (replies to replies are not nested further)

### Edit/Delete
- Edit shows inline textarea
- Delete requires confirmation
- Soft delete for regular users (content shows as "[deleted]")
- Hard delete for admins

## Styling

All components use shadcn/ui components and Tailwind CSS classes. They respect the global theme (light/dark mode).

Key UI components used:
- Button
- Avatar
- Badge
- Textarea
- Separator
- Toast (for notifications)

## Server Actions

The components use these server actions from `/src/lib/comments/actions.ts`:
- `getComments()` - Fetch comments with pagination
- `createComment()` - Create new comment or reply
- `updateComment()` - Edit comment content
- `deleteComment()` - Soft/hard delete comment
- `toggleCommentLike()` - Like/unlike comment

## Type Safety

All components are fully typed with TypeScript. Comment types are generated from the Supabase schema:

```typescript
type Comment = {
  id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_edited: boolean | null;
  user_id: string;
  timestamp_seconds: number | null;
  profiles: Profile;
  like_count: number;
  is_liked: boolean;
  replies?: Reply[];
}
```
