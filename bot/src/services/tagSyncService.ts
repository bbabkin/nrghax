import { Client, Guild, GuildMember, PartialGuildMember, Role } from 'discord.js';
import { profileRepository } from '../database/repositories/profileRepository';
import { logger } from '../utils/logger';
import cron from 'node-cron';
// import { supabase } from '../database/supabase'; // Commented until RPC functions are available

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
      // User doesn't have a profile yet, skip
      return;
    }

    // Get all role names (excluding @everyone)
    const roleNames = newMember.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => role.name);

    // Update the profile with new roles
    await profileRepository.updateDiscordRoles(newMember.id, roleNames);

    // Sync roles as tags
    await this.syncRolesToTags(profile.id, roleNames);

    logger.info(`Updated roles for user ${newMember.user?.tag}: ${roleNames.join(', ')}`);
  }

  /**
   * Handle role creation
   */
  private async handleRoleCreate(role: Role): Promise<void> {
    logger.info(`New role created: ${role.name} in ${role.guild.name}`);

    // Sync this role as a tag
    await this.syncRoleAsTag(role.name, role.id);
  }

  /**
   * Handle role deletion
   */
  private async handleRoleDelete(role: Role): Promise<void> {
    logger.info(`Role deleted: ${role.name} from ${role.guild.name}`);

    // TODO: Handle role deletion in tags
    // This would require an RPC function to delete tags by Discord role ID
  }

  /**
   * Handle role updates
   */
  private async handleRoleUpdate(oldRole: Role, newRole: Role): Promise<void> {
    if (oldRole.name !== newRole.name) {
      logger.info(`Role renamed: ${oldRole.name} -> ${newRole.name} in ${newRole.guild.name}`);

      // TODO: Handle role renaming in tags
      // This would require an RPC function to update tag names by Discord role ID
    }

    // Sync the updated role
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
      // TODO: Implement tag syncing when RPC function is available
      // For now, just log the role sync attempt
      logger.debug(`Would sync role "${roleName}" (${roleId}) as tag - function not yet implemented`);

      // Commented out until RPC function is created in database
      // const { error } = await supabase.rpc('sync_discord_role_as_tag', {
      //   role_name: roleName,
      //   role_id: roleId
      // });
      //
      // if (error) {
      //   logger.error(`Failed to sync role "${roleName}" as tag:`, error);
      // } else {
      //   logger.info(`Successfully synced role "${roleName}" as tag`);
      // }
    } catch (error) {
      logger.error(`Error syncing role as tag:`, error);
    }
  }

  /**
   * Sync user's Discord roles as tags
   */
  private async syncRolesToTags(userId: string, roleNames: string[]): Promise<void> {
    try {
      // TODO: Implement user tag syncing when RPC functions are available
      logger.debug(`Would sync tags for user ${userId} with roles: ${roleNames.join(', ')} - function not yet implemented`);
      return;

      /* Commented out until RPC functions are created in database
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

      // Add the new tags
      if (tagIds.length > 0) {
        const userTags = tagIds.map(tagId => ({
          user_id: userId,
          tag_id: tagId,
          source: 'discord'
        }));

        await supabase
          .from('user_tags')
          .insert(userTags);
      }

      logger.info(`Updated tags for user ${userId}: ${roleNames.join(', ')}`);
      */
    } catch (error) {
      logger.error(`Error syncing roles to tags for user ${userId}:`, error);
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

      for (const [, member] of members) {
        const profile = await profileRepository.findByDiscordId(member.id);

        if (profile) {
          const roleNames = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name);

          await profileRepository.updateDiscordRoles(member.id, roleNames);
          await this.syncRolesToTags(profile.id, roleNames);
        }
      }

      logger.info(`Synced roles for ${members.size} members in guild ${guild.name}`);
    } catch (error) {
      logger.error(`Error syncing guild ${guild.name}:`, error);
    }
  }

  /**
   * Sync all guild members periodically
   */
  private async syncAllGuildMembers(): Promise<void> {
    for (const [, guild] of this.client.guilds.cache) {
      try {
        await this.syncGuildRolesAndMembers(guild);
      } catch (error) {
        logger.error(`Failed to sync guild ${guild.name}:`, error);
      }
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      syncTaskRunning: boolean;
      lastSyncTime?: Date;
      guildsMonitored: number;
    };
  }> {
    return {
      status: this.syncTask ? 'healthy' : 'degraded',
      details: {
        syncTaskRunning: !!this.syncTask,
        guildsMonitored: this.client.guilds.cache.size,
      },
    };
  }
}