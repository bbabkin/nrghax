import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export type Hack = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  contentType: string;
  contentBody?: string | null;
  externalLink?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  likeCount?: number;
  completionCount?: number;
  isLiked?: boolean;
  isCompleted?: boolean;
  tags?: Array<{ id: string; name: string; category?: string | null }>;
};

export async function getHacks(): Promise<Hack[]> {
  try {
    // Get current user from Supabase auth (for user-specific flags)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get all hacks with tags using Prisma
    const hacks = await prisma.hack.findMany({
      include: {
        hackTags: {
          include: {
            tag: true
          }
        },
        userHacks: user ? {
          where: {
            userId: user.id
          }
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match expected format
    return hacks.map(hack => ({
      id: hack.id,
      name: hack.name,
      slug: hack.slug,
      description: hack.description,
      imageUrl: hack.imageUrl,
      imagePath: hack.imagePath,
      contentType: hack.contentType,
      contentBody: hack.contentBody,
      externalLink: hack.externalLink,
      createdAt: hack.createdAt,
      updatedAt: hack.updatedAt,
      tags: hack.hackTags.map(ht => ({
        id: ht.tag.id,
        name: ht.tag.name,
        category: ht.tag.category
      })),
      isLiked: user && hack.userHacks ? hack.userHacks.some(uh => uh.status === 'liked') : false,
      isCompleted: user && hack.userHacks ? hack.userHacks.some(uh => uh.status === 'visited') : false,
      likeCount: 0, // Can be calculated if needed
      completionCount: 0, // Can be calculated if needed
    }));
  } catch (error) {
    console.error('Error fetching hacks with Prisma:', error);
    return [];
  }
}

export async function getHackById(id: string): Promise<Hack | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const hack = await prisma.hack.findUnique({
      where: { id },
      include: {
        hackTags: {
          include: {
            tag: true
          }
        },
        userHacks: user ? {
          where: {
            userId: user.id
          }
        } : false,
        prerequisites: {
          include: {
            prerequisiteHack: true
          }
        }
      }
    });

    if (!hack) return null;

    return {
      id: hack.id,
      name: hack.name,
      slug: hack.slug,
      description: hack.description,
      imageUrl: hack.imageUrl,
      imagePath: hack.imagePath,
      contentType: hack.contentType,
      contentBody: hack.contentBody,
      externalLink: hack.externalLink,
      createdAt: hack.createdAt,
      updatedAt: hack.updatedAt,
      tags: hack.hackTags.map(ht => ({
        id: ht.tag.id,
        name: ht.tag.name,
        category: ht.tag.category
      })),
      isLiked: user && hack.userHacks ? hack.userHacks.some(uh => uh.status === 'liked') : false,
      isCompleted: user && hack.userHacks ? hack.userHacks.some(uh => uh.status === 'visited') : false,
    };
  } catch (error) {
    console.error('Error fetching hack by ID:', error);
    return null;
  }
}

export async function getHackBySlug(slug: string): Promise<Hack | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const hack = await prisma.hack.findUnique({
      where: { slug },
      include: {
        hackTags: {
          include: {
            tag: true
          }
        },
        userHacks: user ? {
          where: {
            userId: user.id
          }
        } : false,
      }
    });

    if (!hack) return null;

    return {
      id: hack.id,
      name: hack.name,
      slug: hack.slug,
      description: hack.description,
      imageUrl: hack.imageUrl,
      imagePath: hack.imagePath,
      contentType: hack.contentType,
      contentBody: hack.contentBody,
      externalLink: hack.externalLink,
      createdAt: hack.createdAt,
      updatedAt: hack.updatedAt,
      tags: hack.hackTags.map(ht => ({
        id: ht.tag.id,
        name: ht.tag.name,
        category: ht.tag.category
      })),
      isLiked: user && hack.userHacks ? hack.userHacks.some(uh => uh.status === 'liked') : false,
      isCompleted: user && hack.userHacks ? hack.userHacks.some(uh => uh.status === 'visited') : false,
    };
  } catch (error) {
    console.error('Error fetching hack by slug:', error);
    return null;
  }
}

export async function checkPrerequisitesCompletedPrisma(hackId: string, userId: string): Promise<boolean> {
  try {
    // Get prerequisites for this hack
    const prerequisites = await prisma.hackPrerequisite.findMany({
      where: {
        hackId: hackId
      },
      select: {
        prerequisiteHackId: true
      }
    });

    if (!prerequisites || prerequisites.length === 0) {
      return true; // No prerequisites, so they're "completed"
    }

    // Check if user has completed all prerequisites
    const prerequisiteIds = prerequisites.map(p => p.prerequisiteHackId).filter(Boolean) as string[];

    const completedCount = await prisma.userHack.count({
      where: {
        userId: userId,
        hackId: {
          in: prerequisiteIds
        },
        status: 'visited'
      }
    });

    return completedCount === prerequisites.length;
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    return false;
  }
}