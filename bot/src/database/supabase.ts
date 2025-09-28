import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    // Support both new secret key format and legacy service role key
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!process.env.SUPABASE_URL || !supabaseSecretKey) {
      logger.error('Missing Supabase environment variables');
      throw new Error('Supabase configuration missing');
    }

    // Log which key type we're using (for debugging)
    if (process.env.SUPABASE_SECRET_KEY) {
      logger.info('Using new SUPABASE_SECRET_KEY format');
    } else {
      logger.info('Using legacy SUPABASE_SERVICE_ROLE_KEY format');
    }

    supabaseInstance = createClient(
      process.env.SUPABASE_URL,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getSupabase();
    return Reflect.get(instance, prop, receiver);
  }
});

// Database types
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  discord_id?: string;
  discord_username?: string;
  discord_roles?: string[];
  created_at: string;
  updated_at: string;
}

export interface Hack {
  id: string;
  name: string;
  description: string;
  requirements?: string[];
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  energy_impact?: number;
  time_investment?: string;
  image_url?: string;
  content_type?: string;
  external_link?: string;
  created_at: string;
  updated_at: string;
}

export interface UserHack {
  id: string;
  user_id: string;
  hack_id: string;
  status: 'active' | 'completed' | 'paused';
  started_at: string;
  completed_at?: string;
  notes?: string;
}