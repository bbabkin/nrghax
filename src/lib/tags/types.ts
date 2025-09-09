export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface UserTag {
  user_id: string;
  tag_id: string;
  assigned_at: string;
  source: 'discord' | 'manual' | 'system';
  tag?: Tag; // For joined queries
}

export interface HackTag {
  hack_id: string;
  tag_id: string;
  assigned_at: string;
  assigned_by: string | null;
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