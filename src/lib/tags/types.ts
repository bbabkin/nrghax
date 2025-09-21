export interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type?: string;
  description?: string | null;
  category?: string | null;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTag {
  id?: string;
  user_id: string;
  tag_id: string;
  source?: string;
  created_at?: string;
  tag?: Tag; // For joined queries
}

export interface HackTag {
  hack_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag; // For joined queries
}

export interface TaggedHack {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  time_minutes: number;
  image_url: string | null;
  created_at: string;
  matching_tags: string[];
}

export interface CreateTagInput {
  name: string;
}

export interface AssignTagInput {
  tag_id: string;
  target_id: string; // Can be user_id or hack_id
  source?: 'discord' | 'manual' | 'system';
}

export interface BulkAssignTagsInput {
  tag_ids: string[];
  hack_ids: string[];
}

export interface SyncDiscordRoleInput {
  role_name: string;
  role_id?: string;
  user_ids?: string[];
}