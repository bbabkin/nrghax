import { supabase, Hack, UserHack } from '../supabase';
import { logger } from '../../utils/logger';

export class HackRepository {
  private cache: Map<string, { data: Hack[], timestamp: number }> = new Map();
  private cacheKey = 'all_hacks';
  private cacheTTL = parseInt(process.env.CACHE_TTL_SECONDS || '300') * 1000;

  /**
   * Get all published hacks with caching
   */
  async getAllHacks(forceRefresh = false): Promise<Hack[]> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = this.cache.get(this.cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
          logger.debug('Returning cached hacks');
          return cached.data;
        }
      }

      const { data, error } = await supabase
        .from('hacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching hacks:', error);
        // Return cached data if available, even if expired
        const cached = this.cache.get(this.cacheKey);
        return cached ? cached.data : [];
      }

      // Update cache
      this.cache.set(this.cacheKey, {
        data: data || [],
        timestamp: Date.now(),
      });

      return data || [];
    } catch (error) {
      logger.error('Unexpected error in getAllHacks:', error);
      const cached = this.cache.get(this.cacheKey);
      return cached ? cached.data : [];
    }
  }

  /**
   * Get a specific hack by ID
   */
  async getHackById(hackId: string): Promise<Hack | null> {
    try {
      // Check if we have cached data
      const cached = this.cache.get(this.cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        const hack = cached.data.find(h => h.id === hackId);
        if (hack) return hack;
      }

      const { data, error } = await supabase
        .from('hacks')
        .select('*')
        .eq('id', hackId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching hack by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Unexpected error in getHackById:', error);
      return null;
    }
  }

  /**
   * Search hacks by name or description
   */
  async searchHacks(query: string): Promise<Hack[]> {
    try {
      const { data, error } = await supabase
        .from('hacks')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) {
        logger.error('Error searching hacks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Unexpected error in searchHacks:', error);
      return [];
    }
  }

  /**
   * Get hacks by category
   */
  async getHacksByCategory(category: string): Promise<Hack[]> {
    try {
      const { data, error } = await supabase
        .from('hacks')
        .select('*')
        .eq('is_published', true)
        .eq('category', category)
        .order('energy_impact', { ascending: false });

      if (error) {
        logger.error('Error fetching hacks by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Unexpected error in getHacksByCategory:', error);
      return [];
    }
  }

  /**
   * Get user's active hacks
   */
  async getUserHacks(userId: string): Promise<UserHack[]> {
    try {
      const { data, error } = await supabase
        .from('user_hacks')
        .select(`
          *,
          hack:hacks(*)
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'paused']);

      if (error) {
        logger.error('Error fetching user hacks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Unexpected error in getUserHacks:', error);
      return [];
    }
  }

  /**
   * Add a hack to user's list
   */
  async addUserHack(userId: string, hackId: string): Promise<UserHack | null> {
    try {
      const { data, error } = await supabase
        .from('user_hacks')
        .insert({
          user_id: userId,
          hack_id: hackId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding user hack:', error);
        return null;
      }

      logger.info(`Added hack ${hackId} for user ${userId}`);
      return data;
    } catch (error) {
      logger.error('Unexpected error in addUserHack:', error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Hack cache cleared');
  }
}

export const hackRepository = new HackRepository();