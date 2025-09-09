import { createClient } from '@/lib/supabase/server';
import { TaggedHack } from './types';
import { Hack } from '../hacks/utils';

export class RecommendationEngine {
  /**
   * Get recommended hacks for a user based on their tags (AND logic)
   */
  static async getRecommendedHacks(userId: string): Promise<TaggedHack[]> {
    const supabase = await createClient();
    
    try {
      // Call the database function to get recommended hacks
      const { data, error } = await supabase
        .rpc('get_recommended_hacks', {
          user_uuid: userId
        });
      
      if (error) {
        console.error('Error fetching recommended hacks:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get recommended hacks:', error);
      return [];
    }
  }
  
  /**
   * Get hacks filtered by specific tags (AND logic)
   */
  static async getHacksByTags(tagIds: string[]): Promise<Hack[]> {
    const supabase = await createClient();
    
    if (tagIds.length === 0) {
      // If no tags specified, return all active hacks
      const { data, error } = await supabase
        .from('hacks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all hacks:', error);
        return [];
      }
      
      return data || [];
    }
    
    // Get hacks that have ALL specified tags
    const { data, error } = await supabase
      .from('hacks')
      .select(`
        *,
        hack_tags!inner(
          tag_id
        )
      `)
      .eq('status', 'active')
      .in('hack_tags.tag_id', tagIds);
    
    if (error) {
      console.error('Error fetching hacks by tags:', error);
      return [];
    }
    
    // Filter to only include hacks that have ALL tags
    const hacksWithAllTags = (data || []).filter(hack => {
      const hackTagIds = hack.hack_tags.map((ht: any) => ht.tag_id);
      return tagIds.every(tagId => hackTagIds.includes(tagId));
    });
    
    // Remove the hack_tags from the result
    return hacksWithAllTags.map(({ hack_tags, ...hack }) => hack);
  }
  
  /**
   * Get recommended hacks with full details including tags
   */
  static async getRecommendedHacksWithDetails(userId: string): Promise<Hack[]> {
    const supabase = await createClient();
    
    try {
      // First get the user's tags
      const { data: userTags } = await supabase
        .from('user_tags')
        .select('tag_id')
        .eq('user_id', userId);
      
      const userTagIds = userTags?.map(ut => ut.tag_id) || [];
      
      if (userTagIds.length === 0) {
        // User has no tags, return all hacks
        const { data: allHacks, error } = await supabase
          .from('hacks')
          .select(`
            *,
            hack_tags(
              tag:tags(id, name, slug)
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching all hacks:', error);
          return [];
        }
        
        // Transform the data
        return (allHacks || []).map(hack => ({
          ...hack,
          tags: hack.hack_tags?.map((ht: any) => ht.tag).filter(Boolean) || []
        }));
      }
      
      // Get hacks that match ALL user tags
      const { data: hacks, error } = await supabase
        .from('hacks')
        .select(`
          *,
          hack_tags(
            tag:tags(id, name, slug)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching hacks:', error);
        return [];
      }
      
      // Filter hacks that have ALL user tags
      const recommendedHacks = (hacks || []).filter(hack => {
        const hackTagIds = hack.hack_tags
          ?.map((ht: any) => ht.tag?.id)
          .filter(Boolean) || [];
        
        // Check if hack has ALL user tags
        return userTagIds.every(tagId => hackTagIds.includes(tagId));
      });
      
      // Transform the data
      return recommendedHacks.map(hack => ({
        ...hack,
        tags: hack.hack_tags?.map((ht: any) => ht.tag).filter(Boolean) || []
      }));
    } catch (error) {
      console.error('Failed to get recommended hacks with details:', error);
      return [];
    }
  }
  
  /**
   * Get user's tag-based preferences
   */
  static async getUserPreferences(userId: string): Promise<{
    tags: Array<{ id: string; name: string; slug: string }>;
    hackCount: number;
  }> {
    const supabase = await createClient();
    
    try {
      // Get user's tags
      const { data: userTags } = await supabase
        .from('user_tags')
        .select('tag:tags(id, name, slug)')
        .eq('user_id', userId);
      
      const tags = userTags?.map(ut => ut.tag).filter(Boolean) || [];
      
      // Get count of recommended hacks
      const recommendedHacks = await this.getRecommendedHacks(userId);
      
      return {
        tags,
        hackCount: recommendedHacks.length
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        tags: [],
        hackCount: 0
      };
    }
  }
  
  /**
   * Cache user recommendations for performance
   */
  private static recommendationCache = new Map<string, {
    data: Hack[];
    timestamp: number;
  }>();
  
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Get cached recommendations or fetch new ones
   */
  static async getCachedRecommendations(userId: string): Promise<Hack[]> {
    const cached = this.recommendationCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    
    // Fetch new recommendations
    const recommendations = await this.getRecommendedHacksWithDetails(userId);
    
    // Cache the results
    this.recommendationCache.set(userId, {
      data: recommendations,
      timestamp: now
    });
    
    // Clean up old cache entries
    this.cleanupCache();
    
    return recommendations;
  }
  
  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    this.recommendationCache.delete(userId);
  }
  
  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.recommendationCache.clear();
  }
  
  /**
   * Clean up expired cache entries
   */
  private static cleanupCache(): void {
    const now = Date.now();
    
    for (const [userId, cached] of this.recommendationCache.entries()) {
      if ((now - cached.timestamp) > this.CACHE_TTL) {
        this.recommendationCache.delete(userId);
      }
    }
  }
}