'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireAuth, getCurrentUser } from '@/lib/auth/user';
import { generateSlug, ensureUniqueSlug, calculateRoutineProgress } from './utils';

// Create a new routine
export async function createRoutine(formData: FormData) {
  const user = await requireAuth();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const isPublic = formData.get('isPublic') === 'true';
  const hackIds = formData.getAll('hackIds') as string[];
  const tagIds = formData.getAll('tagIds') as string[];

  if (!name || !description) {
    throw new Error('Name and description are required');
  }

  // Only admins can make routines public
  const finalIsPublic = user.isAdmin ? isPublic : false;

  const baseSlug = generateSlug(name);
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    const routine = await prisma.routine.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        isPublic: finalIsPublic,
        createdBy: user.id,
        routineHacks: {
          create: hackIds.map((hackId, index) => ({
            hackId,
            position: index
          }))
        },
        routineTags: {
          create: tagIds.map(tagId => ({
            tagId
          }))
        }
      }
    });

    revalidatePath('/routines');
    revalidatePath('/hacks');
    redirect(`/routines/${routine.slug}`);
  } catch (error) {
    console.error('Error creating routine:', error);
    throw new Error('Failed to create routine');
  }
}

// Update an existing routine
export async function updateRoutine(routineId: string, formData: FormData) {
  const user = await requireAuth();

  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    select: { createdBy: true }
  });

  if (!routine) {
    throw new Error('Routine not found');
  }

  // Only the creator or admin can edit
  if (routine.createdBy !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const isPublic = formData.get('isPublic') === 'true';
  const hackIds = formData.getAll('hackIds') as string[];
  const tagIds = formData.getAll('tagIds') as string[];

  if (!name || !description) {
    throw new Error('Name and description are required');
  }

  // Only admins can change public status
  const finalIsPublic = user.isAdmin ? isPublic : false;

  const baseSlug = generateSlug(name);
  const slug = await ensureUniqueSlug(baseSlug, routineId);

  try {
    await prisma.$transaction(async (tx) => {
      // Update routine
      await tx.routine.update({
        where: { id: routineId },
        data: {
          name,
          slug,
          description,
          imageUrl,
          isPublic: finalIsPublic
        }
      });

      // Delete existing hack associations
      await tx.routineHack.deleteMany({
        where: { routineId }
      });

      // Create new hack associations
      await tx.routineHack.createMany({
        data: hackIds.map((hackId, index) => ({
          routineId,
          hackId,
          position: index
        }))
      });

      // Delete existing tag associations
      await tx.routineTag.deleteMany({
        where: { routineId }
      });

      // Create new tag associations
      await tx.routineTag.createMany({
        data: tagIds.map(tagId => ({
          routineId,
          tagId
        }))
      });
    });

    revalidatePath('/routines');
    revalidatePath(`/routines/${slug}`);
    revalidatePath('/hacks');
    redirect(`/routines/${slug}`);
  } catch (error) {
    console.error('Error updating routine:', error);
    throw new Error('Failed to update routine');
  }
}

// Delete a routine
export async function deleteRoutine(routineId: string) {
  const user = await requireAuth();

  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    select: { createdBy: true }
  });

  if (!routine) {
    throw new Error('Routine not found');
  }

  // Only the creator or admin can delete
  if (routine.createdBy !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.routine.delete({
      where: { id: routineId }
    });

    revalidatePath('/routines');
    revalidatePath('/hacks');
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw new Error('Failed to delete routine');
  }
}

// Toggle routine like
export async function toggleRoutineLike(routineId: string) {
  const user = await requireAuth();

  try {
    const existingLike = await prisma.userRoutine.findUnique({
      where: {
        userId_routineId: {
          userId: user.id,
          routineId
        }
      }
    });

    if (existingLike) {
      // Toggle the like status
      await prisma.userRoutine.update({
        where: {
          id: existingLike.id
        },
        data: {
          liked: !existingLike.liked
        }
      });
    } else {
      // Create new user routine with like
      await prisma.userRoutine.create({
        data: {
          userId: user.id,
          routineId,
          liked: true
        }
      });
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error toggling routine like:', error);
    throw new Error('Failed to toggle like');
  }
}

// Start a routine
export async function startRoutine(routineId: string) {
  const user = await requireAuth();

  try {
    const existingUserRoutine = await prisma.userRoutine.findUnique({
      where: {
        userId_routineId: {
          userId: user.id,
          routineId
        }
      }
    });

    if (existingUserRoutine) {
      // Update existing record
      await prisma.userRoutine.update({
        where: {
          id: existingUserRoutine.id
        },
        data: {
          started: true,
          startedAt: existingUserRoutine.startedAt || new Date()
        }
      });
    } else {
      // Create new user routine
      await prisma.userRoutine.create({
        data: {
          userId: user.id,
          routineId,
          started: true,
          startedAt: new Date()
        }
      });
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error starting routine:', error);
    throw new Error('Failed to start routine');
  }
}

// Update routine progress
export async function updateRoutineProgress(routineId: string) {
  const user = await requireAuth();

  try {
    const progress = await calculateRoutineProgress(routineId, user.id);

    const existingUserRoutine = await prisma.userRoutine.findUnique({
      where: {
        userId_routineId: {
          userId: user.id,
          routineId
        }
      }
    });

    if (existingUserRoutine) {
      // Update progress and check if completed
      await prisma.userRoutine.update({
        where: {
          id: existingUserRoutine.id
        },
        data: {
          progress,
          completed: progress === 100,
          completedAt: progress === 100 ? new Date() : null
        }
      });
    } else {
      // Create new user routine with progress
      await prisma.userRoutine.create({
        data: {
          userId: user.id,
          routineId,
          progress,
          completed: progress === 100,
          completedAt: progress === 100 ? new Date() : null
        }
      });
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error updating routine progress:', error);
    throw new Error('Failed to update progress');
  }
}

// Toggle routine public status (admin only)
export async function toggleRoutinePublic(routineId: string) {
  const user = await requireAuth();

  if (!user.isAdmin) {
    throw new Error('Unauthorized');
  }

  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      select: { isPublic: true }
    });

    if (!routine) {
      throw new Error('Routine not found');
    }

    await prisma.routine.update({
      where: { id: routineId },
      data: {
        isPublic: !routine.isPublic
      }
    });

    revalidatePath('/routines');
    revalidatePath('/hacks');
    revalidatePath('/admin/routines');
  } catch (error) {
    console.error('Error toggling routine public status:', error);
    throw new Error('Failed to toggle public status');
  }
}

// Reorder hacks in a routine
export async function reorderRoutineHacks(
  routineId: string,
  hackIds: string[]
) {
  const user = await requireAuth();

  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    select: { createdBy: true }
  });

  if (!routine) {
    throw new Error('Routine not found');
  }

  // Only the creator or admin can reorder
  if (routine.createdBy !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete existing associations
      await tx.routineHack.deleteMany({
        where: { routineId }
      });

      // Create new associations with updated positions
      await tx.routineHack.createMany({
        data: hackIds.map((hackId, index) => ({
          routineId,
          hackId,
          position: index
        }))
      });
    });

    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error reordering routine hacks:', error);
    throw new Error('Failed to reorder hacks');
  }
}