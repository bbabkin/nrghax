import { createClient } from '@/lib/supabase/server';
import { 
  Tag, 
  UserTag, 
  HackTag, 
  CreateTagInput, 
  AssignTagInput, 
  BulkAssignTagsInput 
} from './types';

export class TagService {
  // ============= Tag CRUD Operations =============
  
  /**
   * Create a new tag (admin only)
   */
  static async createTag(input: CreateTagInput): Promise<Tag | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        tag_type: 'user_interest' // Default type
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tag:', error);
      throw new Error(error.message);
    }

    return data as any as Tag;
  }
  
  /**
   * Get a single tag by ID or slug
   */
  static async getTag(idOrSlug: string): Promise<Tag | null> {
    const supabase = await createClient();
    
    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    const { data, error } = isUuid
      ? await supabase
          .from('tags')
          .select('*')
          .eq('id', idOrSlug)
          .single()
      : await supabase
          .from('tags')
          .select('*')
          .eq('slug', idOrSlug)
          .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching tag:', error);
    }
    
    return data as any as Tag;
  }
  
  /**
   * Get all tags
   */
  static async getAllTags(): Promise<Tag[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
    return (data || []) as Tag[];
  }
  
  /**
   * Update a tag (admin only)
   */
  static async updateTag(id: string, name: string): Promise<Tag | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tags')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating tag:', error);
      throw new Error(error.message);
    }
    
    return data as any as Tag;
  }
  
  /**
   * Delete a tag (admin only)
   */
  static async deleteTag(id: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting tag:', error);
      throw new Error(error.message);
    }
    
    return true;
  }
  
  // ============= Hack Tag Operations =============
  
  /**
   * Assign a tag to a hack
   */
  static async assignTagToHack(hack_id: string, tag_id: string): Promise<HackTag | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hack_tags')
      .insert({
        hack_id,
        tag_id
      })
      .select()
      .single();
    
    if (error) {
      // Ignore duplicate key errors
      if (error.code !== '23505') {
        console.error('Error assigning tag to hack:', error);
        throw new Error(error.message);
      }
    }

    return data as any as HackTag;
  }
  
  /**
   * Remove a tag from a hack
   */
  static async removeTagFromHack(hack_id: string, tag_id: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('hack_tags')
      .delete()
      .eq('hack_id', hack_id)
      .eq('tag_id', tag_id);
    
    if (error) {
      console.error('Error removing tag from hack:', error);
      throw new Error(error.message);
    }
    
    return true;
  }
  
  /**
   * Bulk assign tags to a hack
   */
  static async bulkAssignTagsToHack(hack_id: string, tag_ids: string[]): Promise<boolean> {
    const supabase = await createClient();
    
    // First, remove all existing tags for this hack
    await supabase
      .from('hack_tags')
      .delete()
      .eq('hack_id', hack_id);
    
    // Then assign new tags
    if (tag_ids.length > 0) {
      const inserts = tag_ids.map(tag_id => ({
        hack_id,
        tag_id
      }));
      
      const { error } = await supabase
        .from('hack_tags')
        .insert(inserts);
      
      if (error) {
        console.error('Error bulk assigning tags:', error);
        throw new Error(error.message);
      }
    }
    
    return true;
  }
  
  /**
   * Bulk assign tags to multiple hacks
   */
  static async bulkAssignTagsToHacks(input: BulkAssignTagsInput): Promise<boolean> {
    const supabase = await createClient();
    
    const inserts = [];
    for (const hack_id of input.hack_ids) {
      for (const tag_id of input.tag_ids) {
        inserts.push({
          hack_id,
          tag_id
        });
      }
    }
    
    if (inserts.length > 0) {
      const { error } = await supabase
        .from('hack_tags')
        .upsert(inserts, { onConflict: 'hack_id,tag_id' });
      
      if (error) {
        console.error('Error bulk assigning tags to hacks:', error);
        throw new Error(error.message);
      }
    }
    
    return true;
  }
  
  /**
   * Get all tags for a hack
   */
  static async getHackTags(hack_id: string): Promise<Tag[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('hack_tags')
      .select('*, tag:tags(*)')
      .eq('hack_id', hack_id);
    
    if (error) {
      console.error('Error fetching hack tags:', error);
      return [];
    }
    
    return data?.map(ht => ht.tag).filter(Boolean) || [];
  }
  
  // ============= User Tag Operations =============
  
  /**
   * Assign a tag to a user
   */
  static async assignTagToUser(
    user_id: string, 
    tag_id: string, 
    source: 'discord' | 'manual' | 'system' = 'system'
  ): Promise<UserTag | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_tags')
      .insert({
        user_id,
        tag_id,
        source
      })
      .select()
      .single();
    
    if (error) {
      // Ignore duplicate key errors
      if (error.code !== '23505') {
        console.error('Error assigning tag to user:', error);
        throw new Error(error.message);
      }
    }

    return data as any as UserTag;
  }
  
  /**
   * Remove a tag from a user
   */
  static async removeTagFromUser(user_id: string, tag_id: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', user_id)
      .eq('tag_id', tag_id);
    
    if (error) {
      console.error('Error removing tag from user:', error);
      throw new Error(error.message);
    }
    
    return true;
  }
  
  /**
   * Get all tags for a user
   */
  static async getUserTags(user_id: string): Promise<Tag[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_tags')
      .select('*, tag:tags(*)')
      .eq('user_id', user_id);
    
    if (error) {
      console.error('Error fetching user tags:', error);
      return [];
    }
    
    return data?.map(ut => ut.tag).filter(Boolean) || [];
  }
  
  /**
   * Sync user tags (remove old, add new based on source)
   */
  static async syncUserTags(
    user_id: string, 
    tag_ids: string[], 
    source: 'discord' | 'manual' | 'system' = 'discord'
  ): Promise<boolean> {
    const supabase = await createClient();
    
    // Remove all existing tags from this source
    await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', user_id)
      .eq('source', source);
    
    // Add new tags
    if (tag_ids.length > 0) {
      const inserts = tag_ids.map(tag_id => ({
        user_id,
        tag_id,
        source
      }));
      
      const { error } = await supabase
        .from('user_tags')
        .insert(inserts);
      
      if (error) {
        console.error('Error syncing user tags:', error);
        throw new Error(error.message);
      }
    }
    
    return true;
  }
  
  // ============= Utility Functions =============
  
  /**
   * Check if a tag name already exists
   */
  static async tagExists(name: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('tags')
      .select('id')
      .ilike('name', name)
      .single();
    
    return !!data;
  }
  
  /**
   * Generate a URL-safe slug from tag name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
      .replace(/\s+/g, '-')          // Replace spaces with hyphens
      .replace(/-+/g, '-')           // Replace multiple hyphens with single
      .trim();
  }
}