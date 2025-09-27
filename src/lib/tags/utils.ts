import { createClient } from '@/lib/supabase/server';
import { TagService } from './tagService';
import type { Tag } from './types';

/**
 * Get all tags from the database
 * Used in routine creation/editing forms
 */
export async function getTags(): Promise<Tag[]> {
  try {
    return await TagService.getAllTags();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Get tags for a specific hack
 */
export async function getHackTags(hackId: string): Promise<Tag[]> {
  try {
    // TagService.getHackTags already returns Tag[]
    return await TagService.getHackTags(hackId);
  } catch (error) {
    console.error('Error fetching hack tags:', error);
    return [];
  }
}

/**
 * Get tags for a specific user
 */
export async function getUserTags(userId: string): Promise<Tag[]> {
  try {
    // TagService.getUserTags already returns Tag[]
    return await TagService.getUserTags(userId);
  } catch (error) {
    console.error('Error fetching user tags:', error);
    return [];
  }
}