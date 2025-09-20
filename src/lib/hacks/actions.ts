'use server';

import { requireAuth, requireAdmin, getCurrentUser } from '@/lib/auth/user';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type HackFormData = {
  name: string;
  description: string;
  imageUrl: string;
  imagePath?: string;
  contentType: 'content' | 'link';
  contentBody?: string | null;
  externalLink?: string | null;
  prerequisiteIds?: string[];
  difficulty?: string;
  timeMinutes?: number;
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+/, '')        // Remove leading hyphens
    .replace(/-+$/, '');       // Remove trailing hyphens
}

export async function createHack(formData: HackFormData) {
  const user = await requireAdmin();

  // Validate content XOR link
  if (formData.contentType === 'content' && !formData.contentBody) {
    throw new Error('Content is required for content type');
  }
  if (formData.contentType === 'link' && !formData.externalLink) {
    throw new Error('External link is required for link type');
  }

  // Generate a unique slug
  const baseSlug = generateSlug(formData.name);
  const randomSuffix = crypto.randomUUID().substring(0, 8);
  const slug = `${baseSlug}-${randomSuffix}`;

  // Create the hack
  const hack = await prisma.hack.create({
    data: {
      name: formData.name,
      slug: slug,
      description: formData.description,
      imageUrl: formData.imagePath ? '' : formData.imageUrl,
      imagePath: formData.imagePath || null,
      contentType: formData.contentType,
      contentBody: formData.contentBody,
      externalLink: formData.externalLink,
      difficulty: formData.difficulty,
      timeMinutes: formData.timeMinutes,
      createdBy: user.id
    }
  });

  // Add prerequisites if any
  if (formData.prerequisiteIds && formData.prerequisiteIds.length > 0) {
    const prerequisites = formData.prerequisiteIds.map(prereqId => ({
      hackId: hack.id,
      prerequisiteId: prereqId,
    }));

    await prisma.hackPrerequisite.createMany({
      data: prerequisites
    });
  }

  revalidatePath('/admin/hacks');
  return hack;
}

export async function updateHack(id: string, formData: HackFormData) {
  await requireAdmin();

  // Validate content XOR link
  if (formData.contentType === 'content' && !formData.contentBody) {
    throw new Error('Content is required for content type');
  }
  if (formData.contentType === 'link' && !formData.externalLink) {
    throw new Error('External link is required for link type');
  }

  // Get the existing hack to check if name changed
  const existingHack = await prisma.hack.findUnique({
    where: { id },
    select: { name: true, slug: true }
  });

  // Generate new slug if name changed
  let updateData: any = {
    name: formData.name,
    description: formData.description,
    imageUrl: formData.imagePath ? '' : formData.imageUrl,
    imagePath: formData.imagePath || null,
    contentType: formData.contentType,
    contentBody: formData.contentBody,
    externalLink: formData.externalLink,
    difficulty: formData.difficulty,
    timeMinutes: formData.timeMinutes,
  };

  if (existingHack && existingHack.name !== formData.name) {
    const baseSlug = generateSlug(formData.name);
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    updateData.slug = `${baseSlug}-${randomSuffix}`;
  }

  // Update the hack
  await prisma.hack.update({
    where: { id },
    data: updateData
  });

  // Update prerequisites
  // First, delete existing prerequisites
  await prisma.hackPrerequisite.deleteMany({
    where: { hackId: id }
  });

  // Then add new ones if any
  if (formData.prerequisiteIds && formData.prerequisiteIds.length > 0) {
    const prerequisites = formData.prerequisiteIds.map(prereqId => ({
      hackId: id,
      prerequisiteId: prereqId,
    }));

    await prisma.hackPrerequisite.createMany({
      data: prerequisites
    });
  }

  revalidatePath('/admin/hacks');
  revalidatePath(`/admin/hacks/${id}/edit`);
  redirect('/admin/hacks');
}

export async function deleteHack(id: string) {
  await requireAdmin();

  await prisma.hack.delete({
    where: { id }
  });

  revalidatePath('/admin/hacks');
}

export async function toggleLike(hackId: string) {
  const user = await requireAuth();

  try {
    // Check if user has any interaction with this hack
    const existingInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: user.id,
          hackId: hackId
        }
      }
    });

    if (existingInteraction) {
      // Toggle the liked status
      await prisma.userHack.update({
        where: {
          id: existingInteraction.id
        },
        data: {
          liked: !existingInteraction.liked
        }
      });
    } else {
      // Create new like
      await prisma.userHack.create({
        data: {
          userId: user.id,
          hackId: hackId,
          liked: true,
          viewed: false
        }
      });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    throw new Error(`Failed to toggle like: ${error.message}`);
  }

  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hackId}`);
}

export async function markHackVisited(hackId: string) {
  const user = await requireAuth();

  try {
    // Check if user has any interaction with this hack
    const existingInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: user.id,
          hackId: hackId
        }
      }
    });

    if (existingInteraction) {
      // Update to mark as viewed
      if (!existingInteraction.viewed) {
        await prisma.userHack.update({
          where: {
            id: existingInteraction.id
          },
          data: {
            viewed: true,
            viewedAt: new Date()
          }
        });
      }
    } else {
      // Create new interaction record
      await prisma.userHack.create({
        data: {
          userId: user.id,
          hackId: hackId,
          viewed: true,
          viewedAt: new Date(),
          liked: false
        }
      });
    }
  } catch (error: any) {
    console.error('Error marking hack as visited:', error);
    throw new Error(`Failed to mark as visited: ${error.message}`);
  }

  // Revalidate paths to update the UI
  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hackId}`);
  revalidatePath('/profile');
}