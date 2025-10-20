# Levels System - Setup Guide

## Implementation Summary

I've successfully created a complete gamified levels system for NRGHax! Here's what has been implemented:

## ✅ Completed Tasks

### 1. Database Migration
**File:** `supabase/migrations/20251018000000_add_levels_system.sql`

Created three new tables:
- **levels**: Stores level information (name, slug, description, icon, position)
- **level_prerequisites**: Defines which levels must be completed before others unlock
- **user_levels**: Tracks user progress through each level

Updated `hacks` table with:
- `level_id`: Links hack to a level
- `icon`: For tree visualization
- `is_required`: Whether hack is required for level completion

### 2. TypeScript Types
**File:** `src/types/levels.ts`

Comprehensive type definitions for:
- Level entities and relationships
- User progress tracking
- Tree visualization nodes
- Server action results

### 3. Server Actions
**File:** `src/lib/levels/actions.ts`

Full CRUD operations:
- `getAllLevels()`: Get all levels ordered by position
- `getLevelById()`: Get single level with all data
- `getLevelBySlug()`: Get level by URL slug
- `getUserLevelProgress()`: Get user's progress on all levels
- `checkLevelUnlocked()`: Check if prerequisites are met
- `updateUserLevelProgress()`: Recalculate progress after hack completion
- `getLevelTree()`: Get complete tree for visualization
- `getLevelHacks()`: Get hacks within a level
- Admin functions for managing levels, prerequisites, and hack assignments

### 4. UI Components
**Location:** `src/components/levels/`

Created reusable components:
- **LevelCard**: Displays individual level with progress, lock status
- **LevelTreeView**: Shows all levels in a tree layout
- **HackTreeNode**: Individual hack display with completion status
- **HackTreeView**: Shows all hacks within a level

### 5. Documentation
**Files:**
- `docs/LEVELS_SYSTEM.md`: Complete system documentation
- `docs/LEVELS_SETUP.md`: This file - setup instructions

## 🚀 Next Steps to Get It Running

### Step 1: Apply the Migration

When Supabase is available:

```bash
# Start Supabase (if not running)
npm run db:start

# Apply all migrations
npm run db:reset

# Or just push the new migration
npm run db:push

# Generate TypeScript types
npm run db:types
```

### Step 2: Verify Database Setup

After migration, check in Supabase Studio:
1. Verify tables exist: `levels`, `level_prerequisites`, `user_levels`
2. Check `hacks` table has new columns: `level_id`, `icon`, `is_required`
3. Verify RLS policies are active
4. Test database functions: `check_level_prerequisites_met`, `update_user_level_progress`

### Step 3: Create Sample Data

Create some test levels in Supabase Studio or via admin panel:

```sql
-- Example: Create first level
INSERT INTO public.levels (name, slug, description, icon, position)
VALUES ('Foundation', 'foundation', 'Master the basics', '🏛️', 0);

-- Assign some hacks to it
UPDATE public.hacks
SET level_id = '<level-id-from-above>',
    is_required = true,
    icon = '🎯'
WHERE slug IN ('hack-1', 'hack-2', 'hack-3');
```

### Step 4: Create Pages

Create Next.js pages to use the components:

**app/(dashboard)/levels/page.tsx** - List all levels:
```tsx
import { getLevelTree } from '@/lib/levels/actions'
import { LevelTreeView } from '@/components/levels'
import { getCurrentUser } from '@/lib/auth/user'

export default async function LevelsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const tree = await getLevelTree(user.id)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Progression Path</h1>
      <LevelTreeView nodes={tree} />
    </div>
  )
}
```

**app/(dashboard)/levels/[slug]/page.tsx** - Individual level view:
```tsx
import { getLevelBySlug, getLevelHacks } from '@/lib/levels/actions'
import { HackTreeView } from '@/components/levels'
import { getCurrentUser } from '@/lib/auth/user'
import { notFound } from 'next/navigation'

export default async function LevelPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const level = await getLevelBySlug(params.slug)
  if (!level) notFound()

  const hacks = await getLevelHacks(level.id, user.id)

  return (
    <div className="container py-8">
      <HackTreeView hacks={hacks} levelName={level.name} />
    </div>
  )
}
```

### Step 5: Update Hack Completion Logic

Modify hack completion actions to update level progress:

```typescript
import { updateUserLevelProgress } from '@/lib/levels/actions'

// In your existing hack completion function
export async function completeHack(userId: string, hackId: string) {
  // ... existing completion logic ...

  // Get hack's level_id
  const { data: hack } = await supabase
    .from('hacks')
    .select('level_id')
    .eq('id', hackId)
    .single()

  // Update level progress if hack belongs to a level
  if (hack?.level_id) {
    await updateUserLevelProgress(userId, hack.level_id)
  }
}
```

### Step 6: Add Navigation

Add to main navigation:

```tsx
<NavLink href="/levels">Progression</NavLink>
```

## 🎨 Customization

### Styling
- Components use Tailwind CSS and shadcn/ui
- Lock/unlock states have distinct visual styles
- Progress bars show completion percentage
- Required vs optional hacks are visually differentiated

### Icons
- Set `icon` field on levels and hacks
- Use emojis or icon library identifiers
- Icons appear in cards and tree nodes

### Tree Layout
- Current implementation uses simple grid layout
- `LevelTreeView` can be enhanced with graph visualization library (e.g., react-flow, d3)
- Position field controls ordering

## 🔧 Admin Panel

Create admin routes for level management:

**app/admin/levels/page.tsx**:
- List all levels
- Create/edit/delete levels
- Manage prerequisites
- Assign hacks to levels

Use server actions from `src/lib/levels/actions.ts`:
- `createLevel()`
- `updateLevel()`
- `deleteLevel()`
- `addLevelPrerequisite()`
- `removeLevelPrerequisite()`
- `assignHackToLevel()`

## 📊 Monitoring Progress

Track user engagement:
```typescript
// Get user's overall progress
const userLevels = await getUserLevelProgress(userId)
const completedCount = userLevels.filter(ul => ul.completed_at).length
const totalCount = userLevels.length
const overallProgress = (completedCount / totalCount) * 100
```

## 🎯 Key Features Implemented

1. ✅ One-to-many relationship: Level → Hacks
2. ✅ Many-to-many relationship: Routines → Hacks (unchanged, cross-level)
3. ✅ Level prerequisites with automatic unlocking
4. ✅ Required vs optional hacks
5. ✅ Progress tracking (hacks_completed / total_required_hacks)
6. ✅ Visit count tracking (uses existing user_hacks.view_count)
7. ✅ Icon fields for visualization
8. ✅ Position-based ordering within levels
9. ✅ Tree visualization components
10. ✅ Zoom in/out concept (LevelTreeView → HackTreeView)

## 🐛 Troubleshooting

### Migration fails
- Check Supabase is running: `npm run db:start`
- Verify no existing tables conflict
- Check for syntax errors in migration file

### Types not updating
- Run `npm run db:types` after migration
- Restart TypeScript server in VS Code

### RLS blocking access
- Verify user is authenticated
- Check RLS policies in Supabase Studio
- Use `createAdminClient()` for admin operations

## 📝 Notes

- Migration is additive (safe to apply to existing database)
- All existing functionality remains intact
- Levels are optional - hacks work without levels
- System designed for future enhancements (achievements, XP, etc.)

## 🎉 What You Get

A complete gamified progression system where:
- Users see their learning path as an unlockable tree
- Clear visual feedback on progress
- Levels unlock as prerequisites are completed
- Required hacks must be completed, optional ones are bonuses
- Clean separation between levels and routines
- Admin tools for content management

Ready to apply the migration and start building your progression tree!
