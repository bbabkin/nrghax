# Levels System Implementation

## Overview

The levels system adds gamified progression to NRGHax, organizing hacks into skill-based milestones with prerequisite dependencies and visual tree navigation.

## Database Schema

### New Tables

#### `levels`
- Core level information
- Fields: id, name, slug, description, icon, position, created_at, updated_at

#### `level_prerequisites`
- Defines level dependencies
- Fields: id, level_id, prerequisite_level_id, created_at
- Example: "Direction" level requires "Foundation" level

####  `user_levels`
- Tracks user progress through levels
- Fields: id, user_id, level_id, hacks_completed, total_required_hacks, completed_at, created_at, updated_at
- Progress percentage calculated as: (hacks_completed / total_required_hacks) * 100

### Updated Tables

#### `hacks`
Added fields:
- `level_id`: UUID reference to levels table (nullable)
- `icon`: TEXT for tree visualization
- `is_required`: BOOLEAN (default true) - whether hack is required for level completion

## Migration Application

**IMPORTANT**: The migration file has been created at:
```
supabase/migrations/20251018000000_add_levels_system.sql
```

To apply this migration when Supabase is available:

```bash
# Option 1: Reset database (development only)
npm run db:reset

# Option 2: Apply specific migration
supabase db push

# After migration, regenerate types
npm run db:types
```

## Type Definitions

TypeScript types are defined in `/src/types/levels.ts`:
- `Level`: Base level type
- `LevelWithDetails`: Level with hack counts and prerequisites
- `UserLevelProgress`: User's progress on a level
- `LevelTreeNode`: Node for level tree visualization
- `HackTreeNode`: Node for hack tree within a level

## Server Actions

Located in `/src/lib/levels/actions.ts`:

### Public Actions
- `getAllLevels()`: Get all levels ordered by position
- `getLevelById(id)`: Get single level with hacks and prerequisites
- `getLevelBySlug(slug)`: Get level by slug
- `getUserLevelProgress(userId)`: Get user's progress on all levels
- `checkLevelUnlocked(userId, levelId)`: Check if user can access level
- `updateUserLevelProgress(userId, levelId)`: Recalculate progress after hack completion
- `getLevelTree(userId)`: Get complete tree with lock status for visualization
- `getLevelHacks(levelId, userId)`: Get hacks within a level with completion status

### Admin Actions
- `createLevel(data)`: Create new level
- `updateLevel(levelId, data)`: Update level details
- `deleteLevel(levelId)`: Delete level
- `addLevelPrerequisite(levelId, prerequisiteId)`: Add dependency
- `removeLevelPrerequisite(levelId, prerequisiteId)`: Remove dependency
- `assignHackToLevel(hackId, levelId, isRequired)`: Assign hack to level

## Key Features

### 1. Progressive Unlocking
- Levels locked until all prerequisite levels completed
- Visual indicators: locked (gray + lock icon), available, in-progress, completed

### 2. Flexible Completion
- **Required hacks**: Must complete all for level completion
- **Optional hacks**: Contribute to engagement but don't block progress
- Level complete when: all required hacks completed

### 3. Progress Tracking
- Automatic calculation of completion percentage
- View count tracking per hack (uses existing `user_hacks.view_count`)
- Level completion timestamp

### 4. Visual Tree Navigation
- **Zoom out**: See all levels and dependencies
- **Zoom in**: See hacks within a specific level
- Position field controls visual arrangement
- Arrows/lines show prerequisites

## Database Functions

### `check_level_prerequisites_met(user_id, level_id)`
Returns: BOOLEAN
- Checks if all prerequisite levels are completed
- Used to determine if level is unlocked

### `update_user_level_progress(user_id, level_id)`
Returns: { hacks_completed, total_required_hacks, is_completed }
- Recalculates user's progress on a level
- Automatically sets/unsets completed_at
- Call this after any hack completion

## Usage Examples

### Get Level Tree for User
```typescript
import { getLevelTree } from '@/lib/levels/actions'

const tree = await getLevelTree(userId)
// Returns array of LevelTreeNode with lock status, progress, etc.
```

### Check if User Can Access Level
```typescript
import { checkLevelUnlocked } from '@/lib/levels/actions'

const status = await checkLevelUnlocked(userId, levelId)
if (!status.is_unlocked) {
  console.log('Missing prerequisites:', status.missing_prerequisites)
}
```

### Update Progress After Hack Completion
```typescript
import { updateUserLevelProgress } from '@/lib/levels/actions'

// After user completes a hack in a level
const result = await updateUserLevelProgress(userId, levelId)
console.log(`Progress: ${result.progress_percentage}%`)
if (result.is_completed) {
  // Level just completed! Show celebration
}
```

## Integration with Existing Systems

### Routines
- Routines can contain hacks from multiple levels
- Completing hack via routine still updates level progress
- No direct connection between routines and levels

### Hacks
- Each hack belongs to at most one level
- `position` field now represents order within the level
- `is_required` determines if hack blocks level completion

### User Progress
- Uses existing `user_hacks` table for completion tracking
- `view_count` tracks hack visits from any source
- Level progress auto-updates when hack is completed

## UI Components (To Be Created)

### LevelTree Component
- Shows all levels as connected nodes
- Displays lock status, progress bars
- Click to zoom into level

### HackTree Component
- Shows hacks within a level
- Rectangles with icons
- Lines showing hack prerequisites
- Required vs optional visual distinction

### LevelCard Component
- Level name, icon, description
- Progress bar: "3/5 required hacks completed"
- Lock icon if prerequisites not met
- Optional hack count displayed separately

## RLS Policies

### Levels
- Public read access
- Admin-only create/update/delete

### Level Prerequisites
- Public read access
- Admin-only modifications

### User Levels
- Users can only view/modify their own progress
- Automatic updates via database functions

## Next Steps

1. ✅ Create migration file
2. ✅ Define TypeScript types
3. ✅ Implement server actions
4. ⏳ Apply migration (requires Supabase)
5. ⏳ Create UI components
6. ⏳ Add to admin panel
7. ⏳ Test with sample data
8. ⏳ Create seed data for demo levels

## Sample Level Structure

Example progression tree:

```
Foundation (Level 1)
└── Direction (Level 2) [requires: Foundation]
    ├── Movement (Level 3) [requires: Direction]
    └── Coordination (Level 3) [requires: Direction]
        └── Advanced Techniques (Level 4) [requires: Coordination, Movement]
```

Each level contains 3-7 hacks, mix of required and optional.
