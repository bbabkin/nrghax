import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export async function ensureProfileSync(userId: string) {
  try {
    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: userId }
    });

    if (!profile) {
      // Get user from Supabase auth
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.admin.getUser(userId);

      if (!error && user) {
        // Create profile
        await prisma.profile.create({
          data: {
            id: user.id,
            email: user.email!,
            fullName: user.user_metadata?.full_name || user.user_metadata?.name,
            avatarUrl: user.user_metadata?.avatar_url,
          }
        });
      }
    }
    return profile;
  } catch (error) {
    console.error('Profile sync error:', error);
    return null;
  }
}

export async function syncAllProfiles() {
  const supabase = await createClient();

  // Get all auth users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error || !users) {
    console.error('Error fetching users:', error);
    return { synced: 0, errors: [] };
  }

  let synced = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          email: user.email!,
          updatedAt: new Date(),
        },
        create: {
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name,
          avatarUrl: user.user_metadata?.avatar_url,
        }
      });
      synced++;
    } catch (err) {
      errors.push(`Failed to sync ${user.email}: ${err}`);
    }
  }

  return { synced, errors };
}