import { z } from 'zod';
import type { Tables } from '@/types/supabase';

// Base Supabase type for hacks table
export type HackRow = Tables<'hacks'>;

// Extended Hack type with computed fields from queries
export interface Hack extends Omit<HackRow, 'image_url' | 'image_path' | 'content_type' | 'content_body' | 'external_link' | 'media_type' | 'media_url' | 'media_thumbnail_url' | 'created_at' | 'updated_at' | 'time_minutes'> {
  // Convert snake_case to camelCase for consistency
  imageUrl: string;
  imagePath: string | null;
  contentType: 'content' | 'link' | null;
  contentBody: string | null;
  externalLink: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaThumbnailUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  timeMinutes: number | null;

  // Computed/joined fields
  tags: Array<{ id: string; name: string; slug: string }>;
  prerequisites: Array<{ id: string; name: string }>;
  prerequisiteIds: string[];
  likeCount: number;
  viewCount?: number;
  isLiked: boolean;
  isViewed: boolean;
}

// Zod schema for hack form validation
export const HackFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug is too long'),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  image_path: z.string().optional(),
  content_type: z.enum(['content', 'link']),
  content_body: z.string().optional(),
  external_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  media_type: z.enum(['none', 'youtube', 'tiktok', 'mp3', 'video', 'audio']).default('none'),
  media_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  media_thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  difficulty: z.string().optional(),
  time_minutes: z.number().int().positive().optional(),
  prerequisite_ids: z.array(z.string()).default([]),
  category: z.string().optional(),
});

// Type inference from Zod schema
export type HackFormData = z.infer<typeof HackFormSchema>;

// Type for creating a new hack (insert)
export type CreateHackData = Omit<HackRow, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;

// Type for updating a hack
export type UpdateHackData = Partial<CreateHackData>;