# Hack Prerequisites System

## Overview

The hack prerequisites system allows hacks within a level to have dependencies on other hacks. Users must complete prerequisite hacks before they can access dependent hacks.

## Features

### 1. **Hack-Level Prerequisites**
- Each hack can have zero or more prerequisite hacks
- Prerequisites are stored in the `hack_prerequisites` table
- Prerequisites can be from the same level or different levels

### 2. **Visual Locked State**
- Locked hacks show a lock icon instead of the completion status
- Locked hacks have reduced opacity and a grayed-out appearance
- A "Locked" badge overlay indicates the hack is inaccessible
- Prerequisite count is displayed (e.g., "Complete 2 prerequisites first")

### 3. **Interaction Prevention**
- Locked hacks are not wrapped in a Link component
- Cursor changes to `not-allowed` when hovering over locked hacks
- No navigation occurs when clicking a locked hack

### 4. **Real-Time Unlocking**
- Hacks automatically unlock when all prerequisites are completed
- Works for both authenticated and anonymous users
- Uses localStorage for anonymous users
- Updates in real-time via event listeners

## Database Schema

### hack_prerequisites Table

```sql
CREATE TABLE public.hack_prerequisites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  prerequisite_hack_id UUID REFERENCES public.hacks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hack_id, prerequisite_hack_id)
);
```

### Example Data

```sql
-- Hack B requires Hack A to be completed first
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
VALUES ('hack-b-uuid', 'hack-a-uuid');

-- Hack C requires both Hack A and Hack B
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
VALUES
  ('hack-c-uuid', 'hack-a-uuid'),
  ('hack-c-uuid', 'hack-b-uuid');
```

## Implementation

### Server-Side (Level Detail Page)

The level detail page fetches hack prerequisites:

```typescript
// Fetch hack prerequisites
const hackIds = hacks.map((h) => h.id)
const { data: hackPrereqs } = await supabase
  .from('hack_prerequisites')
  .select('hack_id, prerequisite_hack_id')
  .in('hack_id', hackIds)

// Build prerequisite map
const hackPrerequisites: Record<string, string[]> = {}
if (hackPrereqs) {
  hackPrereqs.forEach((prereq) => {
    if (!hackPrerequisites[prereq.hack_id]) {
      hackPrerequisites[prereq.hack_id] = []
    }
    hackPrerequisites[prereq.hack_id].push(prereq.prerequisite_hack_id)
  })
}

// Add prerequisites to hacks
hacks = hacks.map((hack) => ({
  ...hack,
  prerequisites: hackPrerequisites[hack.id] || [],
}))
```

### Client-Side (localStorage)

Anonymous users' prerequisite checking uses localStorage:

```typescript
/**
 * Check if a hack is unlocked based on prerequisites
 */
export function isHackUnlocked(
  hackId: string,
  prerequisiteHackIds: string[]
): boolean {
  // No prerequisites = always unlocked
  if (prerequisiteHackIds.length === 0) return true

  // Check if all prerequisite hacks are completed
  return prerequisiteHackIds.every((prereqId) => isHackCompleted(prereqId))
}
```

### HackTreeNode Component

The component checks prerequisites and renders locked state:

```typescript
export function HackTreeNode({ hack, isRequired }: HackTreeNodeProps) {
  const [isUnlocked, setIsUnlocked] = useState(true)
  const prerequisites = hack.prerequisites || []

  // Check if hack is unlocked
  useEffect(() => {
    const checkUnlocked = () => {
      const unlocked = isHackUnlocked(hack.id, prerequisites)
      setIsUnlocked(unlocked)
    }

    checkUnlocked()

    // Listen for progress updates
    window.addEventListener('storage', handleProgressUpdate)
    window.addEventListener('localProgressUpdate', handleProgressUpdate)

    return () => {
      window.removeEventListener('storage', handleProgressUpdate)
      window.removeEventListener('localProgressUpdate', handleProgressUpdate)
    }
  }, [hack.id, prerequisites])

  // Render locked state
  if (!isUnlocked) {
    return (
      <div className="opacity-60 cursor-not-allowed">
        <Lock icon />
        {/* Locked overlay */}
      </div>
    )
  }

  // Render unlocked with Link
  return (
    <Link href={`/hacks/${hack.slug}`}>
      {/* Hack content */}
    </Link>
  )
}
```

## Visual States

### 1. Unlocked & Not Completed
- Default border color
- Circle icon (empty)
- Clickable
- Hover effects enabled

### 2. Unlocked & Completed
- Green border
- CheckCircle icon (filled)
- Clickable
- No hover effects

### 3. Locked
- Gray border
- Lock icon
- Reduced opacity (60%)
- Not clickable
- "Locked" badge overlay
- Shows prerequisite count
- `cursor: not-allowed`

## User Flow

### For Anonymous Users

1. **View Level Page**
   - See all hacks in the level
   - Locked hacks are visually distinguished

2. **Click Unlocked Hack**
   - Navigate to hack detail page
   - Can complete the hack

3. **Complete Hack**
   - Mark as completed in localStorage
   - Triggers `localProgressUpdate` event

4. **Auto-Unlock**
   - Event listeners detect completion
   - Re-check prerequisites for all hacks
   - Locked hacks become unlocked if prerequisites met
   - UI updates in real-time

### For Authenticated Users

Same flow, but:
- Progress stored in database
- Server validates prerequisites
- Works across devices

## Creating Prerequisites

### Admin UI (Future)

Admins will be able to set prerequisites through an admin interface.

### SQL (Current)

```sql
-- Add prerequisite relationship
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
VALUES ('dependent-hack-uuid', 'prerequisite-hack-uuid');

-- Remove prerequisite relationship
DELETE FROM hack_prerequisites
WHERE hack_id = 'dependent-hack-uuid'
  AND prerequisite_hack_id = 'prerequisite-hack-uuid';
```

### Migration Example

```sql
-- Create a learning path: Breathing -> Meditation -> Advanced Meditation

-- Box Breathing (foundation)
-- No prerequisites

-- 4-7-8 Breathing requires Box Breathing
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT
  h1.id as hack_id,
  h2.id as prerequisite_hack_id
FROM hacks h1
CROSS JOIN hacks h2
WHERE h1.slug = '4-7-8-breathing'
  AND h2.slug = 'box-breathing';

-- Basic Meditation requires Box Breathing
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT
  h1.id as hack_id,
  h2.id as prerequisite_hack_id
FROM hacks h1
CROSS JOIN hacks h2
WHERE h1.slug = 'basic-meditation'
  AND h2.slug = 'box-breathing';

-- Advanced Meditation requires both breathing techniques
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT
  h1.id as hack_id,
  h2.id as prerequisite_hack_id
FROM hacks h1
CROSS JOIN hacks h2
WHERE h1.slug = 'advanced-meditation'
  AND h2.slug IN ('4-7-8-breathing', 'basic-meditation');
```

## Best Practices

### 1. **Prerequisite Design**
- Keep prerequisite chains reasonable (max 3-4 deep)
- Ensure prerequisites are logical and educational
- Avoid circular dependencies
- Test the learning path before deploying

### 2. **User Experience**
- Clearly show why a hack is locked
- Provide direct links to prerequisites
- Don't hide locked hacks, show them grayed out
- Update unlock status immediately after completion

### 3. **Performance**
- Fetch all prerequisites in a single query
- Use event listeners for real-time updates
- Cache prerequisite checks client-side
- Minimize re-renders

## Testing

### Manual Testing

1. **Create Prerequisites**
   ```sql
   INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
   VALUES ('hack-b-id', 'hack-a-id');
   ```

2. **Visit Level Page**
   - Verify Hack B shows as locked
   - Verify Hack A is unlocked

3. **Complete Hack A**
   - Mark as completed (for anonymous users, use browser)
   - Verify Hack B automatically unlocks

4. **Refresh Page**
   - Verify locked/unlocked state persists

### Browser Console Testing

```javascript
// Mark hack as completed
localStorage.setItem('nrghax_hack_progress', JSON.stringify({
  'hack-a-id': {
    hackId: 'hack-a-id',
    completed: true,
    completedAt: new Date().toISOString(),
    viewCount: 1,
    lastViewedAt: new Date().toISOString()
  }
}))

// Trigger update
window.dispatchEvent(new Event('localProgressUpdate'))

// Check if hack is unlocked
import { isHackUnlocked } from '@/lib/levels/localStorage'
isHackUnlocked('hack-b-id', ['hack-a-id'])
```

## Troubleshooting

### Hack Stays Locked After Completing Prerequisites

**Possible Causes:**
1. LocalStorage not updated
2. Event listeners not firing
3. Prerequisite IDs mismatch

**Solutions:**
- Check browser console for errors
- Verify localStorage contains completion data
- Manually trigger `localProgressUpdate` event
- Check prerequisite IDs match exactly

### Locked Hacks Are Clickable

**Cause:** Link wrapper not removed for locked hacks

**Solution:** Check HackTreeNode component returns content without Link when locked

### Prerequisites Not Loading

**Cause:** Database query failing or empty result

**Solution:**
- Check browser Network tab for failed requests
- Verify `hack_prerequisites` table has data
- Check RLS policies allow reading prerequisites

## Future Enhancements

1. **Visual Prerequisite Graph**
   - Show dependency tree
   - Highlight completion path
   - Interactive prerequisite visualization

2. **Smart Recommendations**
   - Suggest next hack to unlock maximum value
   - Show completion percentage for unlocking new hacks

3. **Prerequisite Templates**
   - Pre-built learning paths
   - One-click prerequisite setup for common patterns

4. **Cross-Level Prerequisites**
   - Allow hacks in Level B to require hacks from Level A
   - Currently supported in schema, needs UI updates
