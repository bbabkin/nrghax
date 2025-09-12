import { Client, Guild, GuildMember, PartialGuildMember, Role } from 'discord.js';
import { profileRepository } from '../database/repositories/profileRepository';
import { logger } from '../utils/logger';
import cron from 'node-cron';
import { supabase } from '../database/supabase';

export class TagSyncService {
  private client: Client;
  private syncTask: cron.ScheduledTask | null = null;
  private syncInterval: string = '*/30 * * * *'; // Every 30 minutes

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Initialize the tag sync service
   */
  async initialize(): Promise<void> {
    logger.info('Initializing tag sync service');

    // Set up event listeners
    this.setupEventListeners();

    // Start periodic sync
    this.startPeriodicSync();

    // Do initial sync for all guilds
    await this.initialSync();
  }

  /**
   * Set up Discord event listeners for role changes
   */
  private setupEventListeners(): void {
    // Listen for member role updates
    this.client.on('guildMemberUpdate', async (_oldMember, newMember) => {
      try {
        await this.handleMemberRoleUpdate(newMember);
      } catch (error) {
        logger.error('Error handling member role update:', error);
      }
    });

    // Listen for role creation
    this.client.on('roleCreate', async (role) => {
      try {
        await this.handleRoleCreate(role);
      } catch (error) {
        logger.error('Error handling role creation:', error);
      }
    });

    // Listen for role deletion
    this.client.on('roleDelete', async (role) => {
      try {
        await this.handleRoleDelete(role);
      } catch (error) {
        logger.error('Error handling role deletion:', error);
      }
    });

    // Listen for role updates (name changes)
    this.client.on('roleUpdate', async (oldRole, newRole) => {
      try {
        await this.handleRoleUpdate(oldRole, newRole);
      } catch (error) {
        logger.error('Error handling role update:', error);
      }
    });
  }

  /**
   * Handle member role updates
   */
  private async handleMemberRoleUpdate(
    newMember: GuildMember | PartialGuildMember
  ): Promise<void> {
    // Get the profile for this Discord user
    const profile = await profileRepository.findByDiscordId(newMember.id);
    
    if (!profile) {
      logger.debug(`No profile found for Discord user ${newMember.id}`);
      return;
    }

    // Get role names (excluding @everyone)
    const roleNames = newMember.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => role.name);

    logger.info(`Syncing ${roleNames.length} roles for user ${newMember.user.tag}`);

    // Update profile with new roles
    await profileRepository.updateDiscordRoles(newMember.id, roleNames);

    // Sync roles as tags in the main app
    await this.syncRolesToTags(profile.id, roleNames);
  }

  /**
   * Handle role creation
   */
  private async handleRoleCreate(role: Role): Promise<void> {
    if (role.name === '@everyone') return;

    logger.info(`New role created: ${role.name}`);
    
    // Sync the new role as a tag
    await this.syncRoleAsTag(role.name, role.id);
  }

  /**
   * Handle role deletion
   */
  private async handleRoleDelete(role: Role): Promise<void> {
    if (role.name === '@everyone') return;

    logger.info(`Role deleted: ${role.name}`);
    
    // Call the main app to handle role deletion
    try {
      const { error } = await supabase.rpc('sync_discord_role_as_tag', {
        role_name: role.name,
        role_id: role.id
      });

      if (error) {
        logger.error('Error syncing deleted role:', error);
      }

      // Remove this role from all users in the database
      // Note: This functionality would need to be implemented if needed
      // await profileRepository.removeRoleFromAllUsers(role.name);
    } catch (error) {
      logger.error('Failed to handle role deletion:', error);
    }
  }

  /**
   * Handle role updates (e.g., name changes)
   */
  private async handleRoleUpdate(oldRole: Role, newRole: Role): Promise<void> {
    if (oldRole.name === newRole.name) return;
    if (newRole.name === '@everyone') return;

    logger.info(`Role renamed from "${oldRole.name}" to "${newRole.name}"`);
    
    // Update the tag name in the main app
    await this.syncRoleAsTag(newRole.name, newRole.id);

    // Update all users who have this role
    const members = newRole.members;
    for (const [, member] of members) {
      const profile = await profileRepository.findByDiscordId(member.id);
      if (profile) {
        const roleNames = member.roles.cache
          .filter(r => r.name !== '@everyone')
          .map(r => r.name);
        
        await profileRepository.updateDiscordRoles(member.id, roleNames);
        await this.syncRolesToTags(profile.id, roleNames);
      }
    }
  }

  /**
   * Sync a Discord role as a tag in the main app
   */
  private async syncRoleAsTag(roleName: string, roleId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('sync_discord_role_as_tag', {
        role_name: roleName,
        role_id: roleId
      });

      if (error) {
        logger.error(`Failed to sync role "${roleName}" as tag:`, error);
      } else {
        logger.info(`Successfully synced role "${roleName}" as tag`);
      }
    } catch (error) {
      logger.error(`Error syncing role as tag:`, error);
    }
  }

  /**
   * Sync user's Discord roles as tags
   */
  private async syncRolesToTags(userId: string, roleNames: string[]): Promise<void> {
    try {
      // First sync all roles as tags
      const tagIds: string[] = [];
      
      for (const roleName of roleNames) {
        const { data: tagId } = await supabase.rpc('sync_discord_role_as_tag', {
          role_name: roleName
        });
        
        if (tagId) {
          tagIds.push(tagId);
        }
      }

      // Clear existing Discord-sourced tags for this user
      await supabase
        .from('user_tags')
        .delete()
        .eq('user_id', userId)
        .eq('source', 'discord');

      // Add new tags
      if (tagIds.length > 0) {
        const inserts = tagIds.map(tag_id => ({
          user_id: userId,
          tag_id,
          source: 'discord'
        }));

        await supabase
          .from('user_tags')
          .insert(inserts);
      }

      logger.info(`Synced ${tagIds.length} tags for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to sync roles as tags for user ${userId}:`, error);
    }
  }

  /**
   * Start periodic sync task
   */
  private startPeriodicSync(): void {
    this.syncTask = cron.schedule(this.syncInterval, async () => {
      logger.info('Starting periodic tag sync');
      await this.syncAllGuildMembers();
    });

    logger.info(`Tag sync scheduled to run every 30 minutes`);
  }

  /**
   * Stop periodic sync task
   */
  stopPeriodicSync(): void {
    if (this.syncTask) {
      this.syncTask.stop();
      this.syncTask = null;
      logger.info('Periodic tag sync stopped');
    }
  }

  /**
   * Initial sync of all roles and members
   */
  private async initialSync(): Promise<void> {
    logger.info('Starting initial tag sync for all guilds');

    for (const [, guild] of this.client.guilds.cache) {
      await this.syncGuildRolesAndMembers(guild);
    }

    logger.info('Initial tag sync completed');
  }

  /**
   * Sync all roles and members in a guild
   */
  private async syncGuildRolesAndMembers(guild: Guild): Promise<void> {
    try {
      // First sync all roles as tags
      const roles = guild.roles.cache.filter(role => role.name !== '@everyone');
      
      for (const [, role] of roles) {
        await this.syncRoleAsTag(role.name, role.id);
      }

      logger.info(`Synced ${roles.size} roles as tags for guild ${guild.name}`);

      // Then sync all members' roles
      const members = await guild.members.fetch();
      let syncedCount = 0;

      for (const [, member] of members) {
        const profile = await profileRepository.findByDiscordId(member.id);
        
        if (profile) {
          const roleNames = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name);

          await profileRepository.updateDiscordRoles(member.id, roleNames);
          await this.syncRolesToTags(profile.id, roleNames);
          syncedCount++;
        }
      }

      logger.info(`Synced roles for ${syncedCount} members in guild ${guild.name}`);
    } catch (error) {
      logger.error(`Error syncing guild ${guild.name}:`, error);
    }
  }

  /**
   * Sync all members across all guilds
   */
  private async syncAllGuildMembers(): Promise<void> {
    for (const [, guild] of this.client.guilds.cache) {
      await this.syncGuildRolesAndMembers(guild);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    guilds: number;
    roles: number;
    members: number;
    lastSync: Date;
  }> {
    const stats = {
      guilds: this.client.guilds.cache.size,
      roles: 0,
      members: 0,
      lastSync: new Date()
    };

    for (const [, guild] of this.client.guilds.cache) {
      stats.roles += guild.roles.cache.size - 1; // Exclude @everyone
      stats.members += guild.memberCount;
    }

    return stats;
  }
}