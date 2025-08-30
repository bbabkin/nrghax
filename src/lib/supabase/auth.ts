/**
 * Authentication utility functions for Supabase Auth
 * Provides role-based access control and session management
 */

import { createSupabaseClient } from './client';
import { createSupabaseServerClient } from './server';
import type { UserRole, UserProfile } from '@/types/auth';

// Client-side auth utilities
export const authClient = {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    // Get user profile with role information
    if (data.user) {
      const profile = await this.getUserProfile(data.user.id);
      return { user: data.user, session: data.session, profile };
    }
    
    return { user: data.user, session: data.session, profile: null };
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, userData?: { name?: string }) {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {},
      },
    });
    
    if (error) {
      throw error;
    }
    
    return { user: data.user, session: data.session };
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  },

  /**
   * Sign in with Discord OAuth
   */
  async signInWithDiscord() {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  },

  /**
   * Get current user
   */
  async getUser() {
    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return user;
  },

  /**
   * Get current session
   */
  async getSession() {
    const supabase = createSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return session;
  },

  /**
   * Get user profile with role information
   */
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const supabase = createSupabaseClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await this.getUser();
      if (!user) return null;
      targetUserId = user.id;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Check if user has specific role
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile?.role === role || false;
  },

  /**
   * Check if user is admin (admin or super_admin)
   */
  async isAdmin(): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile?.role === 'admin' || profile?.role === 'super_admin' || false;
  },

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile?.role === 'super_admin' || false;
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      throw error;
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      throw error;
    }
  },
};

// Server-side auth utilities
export const authServer = {
  /**
   * Get user from server-side context
   */
  async getUser() {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  },

  /**
   * Get session from server-side context
   */
  async getSession() {
    const supabase = createSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  },

  /**
   * Get user profile from server-side context
   */
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const supabase = createSupabaseServerClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await this.getUser();
      if (!user) return null;
      targetUserId = user.id;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Check if user has specific role (server-side)
   */
  async hasRole(role: UserRole, userId?: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.role === role || false;
  },

  /**
   * Check if user is admin (server-side)
   */
  async isAdmin(userId?: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.role === 'admin' || profile?.role === 'super_admin' || false;
  },

  /**
   * Check if user is super admin (server-side)
   */
  async isSuperAdmin(userId?: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.role === 'super_admin' || false;
  },
};

// Auth event listeners and session management
export const authEvents = {
  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createSupabaseClient();
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);
    
    return subscription;
  },
};

// Default export for convenience
export default authClient;