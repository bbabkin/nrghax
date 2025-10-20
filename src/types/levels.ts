import { Tables } from './database'

// Level types
export type Level = Tables<'levels'>
export type LevelPrerequisite = Tables<'level_prerequisites'>
export type UserLevel = Tables<'user_levels'>

// Extended hack type with level fields
export interface HackWithLevel extends Tables<'hacks'> {
  level_id: string | null
  icon: string | null
  is_required: boolean
  level?: Level
}

// Level with all related data
export interface LevelWithDetails extends Level {
  required_hacks_count: number
  optional_hacks_count: number
  total_hacks_count: number
  prerequisites?: Level[]
  hacks?: HackWithLevel[]
}

// User level progress with calculated percentage
export interface UserLevelProgress extends UserLevel {
  progress_percentage: number
  is_unlocked: boolean
  level?: LevelWithDetails
}

// Level tree node for visualization
export interface LevelTreeNode {
  level: LevelWithDetails
  userProgress?: UserLevelProgress
  prerequisites: string[] // level IDs
  children: string[] // level IDs that depend on this one
  isLocked: boolean
  isCompleted: boolean
  progressPercentage: number
}

// Hack tree node for visualization within a level
export interface HackTreeNode {
  hack: HackWithLevel
  position: number
  isRequired: boolean
  isCompleted: boolean
  viewCount: number
  prerequisites: string[] // hack IDs
}

// Server action result types
export interface UpdateLevelProgressResult {
  hacks_completed: number
  total_required_hacks: number
  is_completed: boolean
  progress_percentage: number
}

export interface LevelUnlockStatus {
  level_id: string
  is_unlocked: boolean
  missing_prerequisites: string[] // IDs of prerequisite levels not yet completed
}
