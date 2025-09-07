import { Client, Guild, GuildMember, Role } from 'discord.js';
import { profileRepository } from '../database/repositories/profileRepository';
import { logger } from '../utils/logger';
import cron from 'node-cron';

export class RoleSyncService {
  private client: Client;
  private syncTask: cron.ScheduledTask | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Start the periodic role sync
   */
  startPeriodicSync() {
    const intervalMinutes = parseInt(process.env.ROLE_SYNC_INTERVAL_MINUTES || '30');
    
    // Run every N minutes
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    this.syncTask = cron.schedule(cronExpression, async () => {
      logger.info('Starting periodic role sync...');
      await this.syncAllRoles();
    });

    logger.info(`Role sync scheduled to run every ${intervalMinutes} minutes`);
  }

  /**
   * Stop the periodic sync
   */
  stopPeriodicSync() {
    if (this.syncTask) {
      this.syncTask.stop();
      this.syncTask = null;
      logger.info('Periodic role sync stopped');
    }
  }

  /**
   * Sync roles for all users
   */
  async syncAllRoles() {
    try {
      const profiles = await profileRepository.getProfilesForRoleSync();
      let syncedCount = 0;
      let errorCount = 0;

      for (const profile of profiles) {
        if (!profile.discord_id) continue;

        try {
          await this.syncUserRoles(profile.discord_id);
          syncedCount++;
        } catch (error) {
          logger.error(`Failed to sync roles for Discord ID ${profile.discord_id}:`, error);
          errorCount++;
        }
      }

      logger.info(`Role sync completed: ${syncedCount} synced, ${errorCount} errors`);
    } catch (error) {
      logger.error('Error during role sync:', error);
    }
  }

  /**
   * Sync roles for a specific user across all guilds
   */
  async syncUserRoles(discordId: string) {
    const profile = await profileRepository.findByDiscordId(discordId);
    if (!profile) {
      logger.warn(`No profile found for Discord ID: ${discordId}`);
      return;
    }

    const nrgRoles = profile.discord_roles || [];
    const guilds = this.client.guilds.cache;

    for (const [guildId, guild] of guilds) {
      try {
        const member = await this.fetchGuildMember(guild, discordId);
        if (!member) continue;

        await this.syncMemberRoles(member, nrgRoles);
      } catch (error) {
        logger.error(`Error syncing roles in guild ${guildId}:`, error);
      }
    }
  }

  /**
   * Handle role update event from Discord
   */
  async handleDiscordRoleUpdate(oldMember: GuildMember, newMember: GuildMember) {
    try {
      const oldRoles = this.extractRoleNames(oldMember.roles.cache);
      const newRoles = this.extractRoleNames(newMember.roles.cache);

      // Check if roles actually changed
      if (this.arraysEqual(oldRoles, newRoles)) {
        return;
      }

      logger.info(`Roles changed for ${newMember.user.tag} in ${newMember.guild.name}`);
      
      // Update the profile with new roles
      await profileRepository.updateDiscordRoles(newMember.id, newRoles);

      // Emit custom event for role change
      this.client.emit('nrgRoleSync', {
        userId: newMember.id,
        username: newMember.user.tag,
        guildId: newMember.guild.id,
        guildName: newMember.guild.name,
        oldRoles,
        newRoles,
      });
    } catch (error) {
      logger.error('Error handling Discord role update:', error);
    }
  }

  /**
   * Sync roles from NRGhax to Discord for a specific member
   */
  private async syncMemberRoles(member: GuildMember, nrgRoles: string[]) {
    const guild = member.guild;
    const currentRoles = this.extractRoleNames(member.roles.cache);

    // Determine which roles to add/remove
    const rolesToAdd: Role[] = [];
    const rolesToRemove: Role[] = [];

    // Find roles to add
    for (const roleName of nrgRoles) {
      if (!currentRoles.includes(roleName)) {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role && !role.managed && role.position < guild.members.me!.roles.highest.position) {
          rolesToAdd.push(role);
        }
      }
    }

    // Find NRG-managed roles to remove (you might want to prefix these with 'nrg-' or similar)
    for (const role of member.roles.cache.values()) {
      if (this.isNRGManagedRole(role) && !nrgRoles.includes(role.name)) {
        if (!role.managed && role.position < guild.members.me!.roles.highest.position) {
          rolesToRemove.push(role);
        }
      }
    }

    // Apply role changes
    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd, 'NRGhax role sync');
      logger.info(`Added roles to ${member.user.tag}: ${rolesToAdd.map(r => r.name).join(', ')}`);
    }

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove, 'NRGhax role sync');
      logger.info(`Removed roles from ${member.user.tag}: ${rolesToRemove.map(r => r.name).join(', ')}`);
    }
  }

  /**
   * Check if a role is managed by NRGhax
   */
  private isNRGManagedRole(role: Role): boolean {
    // You can customize this logic based on your role naming convention
    // For example, all NRG-managed roles could start with 'nrg-' or have specific names
    const nrgRoleNames = [
      'energy-optimizer',
      'morning-person',
      'night-owl',
      'fitness-enthusiast',
      'mindfulness-practitioner',
      'productivity-master',
      'biohacker',
      'sleep-optimizer',
    ];

    return nrgRoleNames.includes(role.name.toLowerCase());
  }

  /**
   * Extract role names from a collection
   */
  private extractRoleNames(roles: Map<string, Role>): string[] {
    return Array.from(roles.values())
      .filter(role => role.name !== '@everyone')
      .map(role => role.name);
  }

  /**
   * Fetch a guild member safely
   */
  private async fetchGuildMember(guild: Guild, userId: string): Promise<GuildMember | null> {
    try {
      return await guild.members.fetch(userId);
    } catch (error) {
      // User not in this guild
      return null;
    }
  }

  /**
   * Compare two arrays for equality
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }

  /**
   * Create or ensure NRG roles exist in a guild
   */
  async ensureNRGRoles(guild: Guild) {
    const nrgRoles = [
      { name: 'energy-optimizer', color: 0x10B981, reason: 'NRGhax role' },
      { name: 'morning-person', color: 0xFBBF24, reason: 'NRGhax role' },
      { name: 'night-owl', color: 0x6366F1, reason: 'NRGhax role' },
      { name: 'fitness-enthusiast', color: 0xEF4444, reason: 'NRGhax role' },
      { name: 'mindfulness-practitioner', color: 0x8B5CF6, reason: 'NRGhax role' },
      { name: 'productivity-master', color: 0x3B82F6, reason: 'NRGhax role' },
      { name: 'biohacker', color: 0x10B981, reason: 'NRGhax role' },
      { name: 'sleep-optimizer', color: 0x6366F1, reason: 'NRGhax role' },
    ];

    for (const roleData of nrgRoles) {
      const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
      if (!existingRole) {
        try {
          await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            reason: roleData.reason,
          });
          logger.info(`Created role ${roleData.name} in guild ${guild.name}`);
        } catch (error) {
          logger.error(`Failed to create role ${roleData.name} in guild ${guild.name}:`, error);
        }
      }
    }
  }
}

export default RoleSyncService;