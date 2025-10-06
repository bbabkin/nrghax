'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface RoutinePlayState {
  currentPosition: number;
  progress: number;
  completed: boolean;
  autoplayEnabled: boolean;
  lastPlayedAt?: string;
  completedHacks?: string[];
}

export interface UpdatePositionOptions {
  retries?: number;
}

/**
 * Update the user's current position in a routine
 */
export async function updateRoutinePosition(
  routineId: string,
  position: number,
  totalHacks?: number,
  options?: UpdatePositionOptions
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { retries = 0 } = options || {};

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Call the database function
    const { data, error } = await supabase.rpc('update_routine_position', {
      p_routine_id: routineId,
      p_position: position,
      p_total_hacks: totalHacks,
    });

    if (error) {
      // Retry logic for network errors
      if (retries > 0 && (error.message.includes('Network') || error.message.includes('network'))) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return updateRoutinePosition(routineId, position, totalHacks, { retries: retries - 1 });
      }
      throw error;
    }

    revalidatePath(`/routines/${routineId}`);
    revalidatePath(`/routines/[slug]/play`);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating routine position:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update position',
    };
  }
}

/**
 * Mark a hack as completed within a routine context
 */
export async function markHackComplete(
  hackId: string,
  routineId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('user_hacks')
      .upsert({
        user_id: user.id,
        hack_id: hackId,
        viewed: true,
        viewed_at: now,
        updated_at: now,
      }, {
        onConflict: 'user_id,hack_id',
      });

    if (error) {
      throw error;
    }

    revalidatePath(`/hacks/${hackId}`);
    if (routineId) {
      revalidatePath(`/routines/${routineId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking hack complete:', error);
    return {
      success: false,
      error: error?.message || 'Failed to mark hack complete',
    };
  }
}

/**
 * Save comprehensive routine progress
 */
export async function saveRoutineProgress(params: {
  routineId: string;
  currentPosition: number;
  totalHacks: number;
  completedHacks: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { routineId, currentPosition, totalHacks, completedHacks } = params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const progress = Math.floor((completedHacks.length / totalHacks) * 100);
    const isCompleted = completedHacks.length === totalHacks;
    const now = new Date().toISOString();

    // Mark all completed hacks in user_hacks table
    if (completedHacks.length > 0) {
      const hackRecords = completedHacks.map(hackId => ({
        user_id: user.id,
        hack_id: hackId,
        viewed: true,
        viewed_at: now,
        updated_at: now,
      }));

      const { error: hacksError } = await supabase
        .from('user_hacks')
        .upsert(hackRecords, {
          onConflict: 'user_id,hack_id',
        });

      if (hacksError) {
        console.error('Error marking hacks as complete:', hacksError);
        throw hacksError;
      }
    }

    // Update routine progress
    const { error } = await supabase
      .from('user_routines')
      .upsert({
        user_id: user.id,
        routine_id: routineId,
        current_hack_position: currentPosition,
        progress,
        completed: isCompleted,
        completed_at: isCompleted ? now : null,
        last_played_at: now,
        started: true,
        updated_at: now,
      }, {
        onConflict: 'user_id,routine_id',
      });

    if (error) {
      throw error;
    }

    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/dashboard/routines');

    return { success: true };
  } catch (error: any) {
    console.error('Error saving routine progress:', error);
    return {
      success: false,
      error: error?.message || 'Failed to save progress',
    };
  }
}

/**
 * Get the current play state for a routine
 */
export async function getRoutinePlayState(
  routineId: string
): Promise<{ success: boolean; data?: RoutinePlayState; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: true,
        data: {
          currentPosition: 0,
          progress: 0,
          completed: false,
          autoplayEnabled: true,
        },
      };
    }

    // Get routine progress
    const { data: routineData, error: routineError } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .single();

    if (routineError && routineError.code !== 'PGRST116') {
      throw routineError;
    }

    // Get completed hacks
    const { data: hacksData } = await supabase
      .from('user_hacks')
      .select('hack_id, viewed')
      .eq('user_id', user.id)
      .eq('viewed', true);

    const completedHacks = hacksData?.map(h => h.hack_id) || [];

    return {
      success: true,
      data: {
        currentPosition: routineData?.current_hack_position || 0,
        progress: routineData?.progress || 0,
        completed: routineData?.completed || false,
        autoplayEnabled: routineData?.autoplay_enabled ?? true,
        lastPlayedAt: routineData?.last_played_at,
        completedHacks,
      },
    };
  } catch (error: any) {
    console.error('Error getting routine play state:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get play state',
    };
  }
}

/**
 * Toggle autoplay preference for a routine
 */
export async function toggleAutoplay(
  routineId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase.rpc('toggle_routine_autoplay', {
      p_routine_id: routineId,
      p_enabled: enabled,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling autoplay:', error);
    return {
      success: false,
      error: error?.message || 'Failed to toggle autoplay',
    };
  }
}
