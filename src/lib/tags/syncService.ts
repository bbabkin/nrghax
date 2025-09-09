import { createClient } from '@/lib/supabase/server';
import { TagService } from './tagService';
import { SyncDiscordRoleInput } from './types';

export class DiscordSyncService {
  /**
   * Sync a Discord role as a tag
   */
  static async syncDiscordRoleAsTag(input: SyncDiscordRoleInput): Promise<string | null> {
    const supabase = await createClient();
    
    try {
      // Call the database function to sync role as tag
      const { data, error } = await supabase
        .rpc('sync_discord_role_as_tag', {
          role_name: input.role_name,
          role_id: input.role_id || null
        });
      
      if (error) {
        console.error('Error syncing Discord role as tag:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to sync Discord role:', error);
      return null;
    }
  }
  
  /**
   * Sync all Discord roles for a user
   */
  static async syncUserDiscordRoles(
    user_id: string, 
    discord_roles: string[]
  ): Promise<boolean> {
    try {
      // First, sync all roles as tags
      const tag_ids: string[] = [];
      
      for (const role_name of discord_roles) {
        const tag_id = await this.syncDiscordRoleAsTag({ role_name });
        if (tag_id) {
          tag_ids.push(tag_id);
        }
      }
      
      // Then sync user tags
      await TagService.syncUserTags(user_id, tag_ids, 'discord');
      
      return true;
    } catch (error) {
      console.error('Failed to sync user Discord roles:', error);
      return false;
    }
  }
  
  /**
   * Initial sync of all existing Discord roles
   */
  static async initialSyncAllRoles(roles: Array<{ name: string; id?: string }>): Promise<{
    success: number;
    failed: number;
    tags: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      tags: [] as string[]
    };
    
    for (const role of roles) {
      try {
        const tag_id = await this.syncDiscordRoleAsTag({
          role_name: role.name,
          role_id: role.id
        });
        
        if (tag_id) {
          results.success++;
          results.tags.push(tag_id);
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Failed to sync role ${role.name}:`, error);
        results.failed++;
      }
    }
    
    return results;
  }
  
  /**
   * Handle Discord role deletion (remove from users but keep tag)
   */
  static async handleRoleDeletion(role_name: string): Promise<boolean> {
    const supabase = await createClient();
    
    try {
      // Find the tag for this role
      const tag = await TagService.getTag(TagService.generateSlug(role_name));
      
      if (!tag) {
        console.warn(`Tag not found for role: ${role_name}`);
        return false;
      }
      
      // Remove this tag from all users where source is 'discord'
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('tag_id', tag.id)
        .eq('source', 'discord');
      
      if (error) {
        console.error('Error removing tag from users:', error);
        throw new Error(error.message);
      }
      
      console.log(`Removed tag ${tag.name} from all Discord-synced users`);
      return true;
    } catch (error) {
      console.error('Failed to handle role deletion:', error);
      return false;
    }
  }
  
  /**
   * Sync Discord roles from profile
   */
  static async syncProfileDiscordRoles(profile_id: string): Promise<boolean> {
    const supabase = await createClient();
    
    try {
      // Get the user's Discord roles from their profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('discord_roles')
        .eq('id', profile_id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return false;
      }
      
      if (!profile?.discord_roles || !Array.isArray(profile.discord_roles)) {
        console.log('No Discord roles found for profile');
        return true;
      }
      
      // Sync the roles
      return await this.syncUserDiscordRoles(profile_id, profile.discord_roles);
    } catch (error) {
      console.error('Failed to sync profile Discord roles:', error);
      return false;
    }
  }
  
  /**
   * Batch sync Discord roles for multiple users
   */
  static async batchSyncUserRoles(
    userRoles: Array<{ user_id: string; roles: string[] }>
  ): Promise<{
    success: number;
    failed: number;
  }> {
    const results = {
      success: 0,
      failed: 0
    };
    
    for (const { user_id, roles } of userRoles) {
      try {
        const success = await this.syncUserDiscordRoles(user_id, roles);
        if (success) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Failed to sync roles for user ${user_id}:`, error);
        results.failed++;
      }
    }
    
    return results;
  }
  
  /**
   * Get sync status for monitoring
   */
  static async getSyncStatus(): Promise<{
    total_tags: number;
    discord_synced_tags: number;
    users_with_tags: number;
    last_sync: string | null;
  }> {
    const supabase = await createClient();
    
    try {
      // Get total tags
      const { count: total_tags } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      // Get Discord-synced user tags count
      const { count: discord_synced } = await supabase
        .from('user_tags')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'discord');
      
      // Get unique users with tags
      const { data: users_with_tags } = await supabase
        .from('user_tags')
        .select('user_id')
        .limit(1000);
      
      const unique_users = new Set(users_with_tags?.map(ut => ut.user_id) || []);
      
      return {
        total_tags: total_tags || 0,
        discord_synced_tags: discord_synced || 0,
        users_with_tags: unique_users.size,
        last_sync: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        total_tags: 0,
        discord_synced_tags: 0,
        users_with_tags: 0,
        last_sync: null
      };
    }
  }
}