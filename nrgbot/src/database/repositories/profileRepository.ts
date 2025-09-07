import { supabase, Profile } from '../supabase';
import { logger } from '../../utils/logger';

export class ProfileRepository {
  /**
   * Find a profile by Discord ID
   */
  async findByDiscordId(discordId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('discord_id', discordId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching profile by Discord ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Unexpected error in findByDiscordId:', error);
      return null;
    }
  }

  /**
   * Create or update a profile with Discord information
   */
  async upsertWithDiscordInfo(
    discordId: string,
    discordUsername: string,
    discordRoles?: string[]
  ): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            discord_id: discordId,
            discord_username: discordUsername,
            discord_roles: discordRoles || [],
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'discord_id',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Error upserting profile:', error);
        return null;
      }

      logger.info(`Profile upserted for Discord user: ${discordUsername}`);
      return data;
    } catch (error) {
      logger.error('Unexpected error in upsertWithDiscordInfo:', error);
      return null;
    }
  }

  /**
   * Update Discord roles for a profile
   */
  async updateDiscordRoles(
    discordId: string,
    roles: string[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          discord_roles: roles,
          updated_at: new Date().toISOString(),
        })
        .eq('discord_id', discordId);

      if (error) {
        logger.error('Error updating Discord roles:', error);
        return false;
      }

      logger.info(`Updated roles for Discord ID ${discordId}: ${roles.join(', ')}`);
      return true;
    } catch (error) {
      logger.error('Unexpected error in updateDiscordRoles:', error);
      return false;
    }
  }

  /**
   * Get all profiles that need role sync
   */
  async getProfilesForRoleSync(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('discord_id', 'is', null);

      if (error) {
        logger.error('Error fetching profiles for role sync:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Unexpected error in getProfilesForRoleSync:', error);
      return [];
    }
  }

  /**
   * Link a Discord account to an existing profile by email
   */
  async linkDiscordToProfile(
    email: string,
    discordId: string,
    discordUsername: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          discord_id: discordId,
          discord_username: discordUsername,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        logger.error('Error linking Discord to profile:', error);
        return false;
      }

      logger.info(`Linked Discord ${discordUsername} to email ${email}`);
      return true;
    } catch (error) {
      logger.error('Unexpected error in linkDiscordToProfile:', error);
      return false;
    }
  }
}

export const profileRepository = new ProfileRepository();