import { createClient } from '@/lib/supabase/server';

export class RecommendationEngine {
  /**
   * Get recommended hacks for a user based on their tags
   */
  static async getRecommendedHacks(userId: string): Promise<any[]> {
    const supabase = await createClient();

    try {
      // For now, just return recent hacks
      // TODO: Implement proper recommendation logic based on user tags
      const { data: hacks, error } = await supabase
        .from('hacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching recommended hacks:', error);
        return [];
      }

      return hacks || [];
    } catch (error) {
      console.error('Failed to get recommended hacks:', error);
      return [];
    }
  }

  /**
   * Get hacks filtered by specific tags
   */
  static async getHacksByTags(tagIds: string[]): Promise<any[]> {
    const supabase = await createClient();

    if (tagIds.length === 0) {
      // If no tags specified, return all hacks
      const { data, error } = await supabase
        .from('hacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all hacks:', error);
        return [];
      }

      return data || [];
    }

    // For now, just return hacks without complex filtering
    // TODO: Implement proper tag filtering
    const { data, error } = await supabase
      .from('hacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hacks by tags:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a user's progress on recommended hacks
   */
  static async getUserHackProgress(userId: string, hackIds: string[]): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_hacks')
      .select('*')
      .eq('user_id', userId)
      .in('hack_id', hackIds);

    if (error) {
      console.error('Error fetching user hack progress:', error);
      return [];
    }

    return data || [];
  }
}