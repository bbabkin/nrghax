import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
};

/**
 * Always get user from auth.users first, then enrich with profile data
 * This ensures auth.users is the single source of truth
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  // Get auth user (source of truth)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Try to get profile for additional data
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      isAdmin: true,
      fullName: true,
      avatarUrl: true,
    }
  });

  // If profile doesn't exist, create it
  if (!profile) {
    const newProfile = await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url,
        isAdmin: false,
      }
    });

    return {
      id: user.id,
      email: user.email!,
      fullName: newProfile.fullName,
      avatarUrl: newProfile.avatarUrl,
      isAdmin: newProfile.isAdmin,
    };
  }

  // Combine auth user with profile data
  return {
    id: user.id,
    email: user.email!, // Always use email from auth
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    isAdmin: profile.isAdmin,
  };
}

/**
 * Check if user exists in both auth and profiles
 */
export async function verifyUserSync(userId: string): Promise<{
  inAuth: boolean;
  inProfile: boolean;
  synced: boolean;
}> {
  const supabase = await createClient();

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const profile = await prisma.profile.findUnique({ where: { id: userId } });

  return {
    inAuth: !!authUser,
    inProfile: !!profile,
    synced: !!authUser && !!profile,
  };
}