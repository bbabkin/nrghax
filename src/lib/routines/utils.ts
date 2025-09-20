import { getCurrentUser } from '@/lib/auth/user';
import prisma from '@/lib/db';

export type RoutineWithDetails = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  hacks: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string | null;
    imagePath: string | null;
    contentType: string;
    difficulty?: string | null;
    timeMinutes?: number | null;
    position: number;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  _count?: {
    userRoutines: number;
    routineHacks: number;
  };
  isLiked?: boolean;
  isStarted?: boolean;
  isCompleted?: boolean;
  progress?: number;
};

// Get all public routines and user's own routines
export async function getRoutines(userId?: string) {
  try {
    const routines = await prisma.routine.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(userId ? [{ createdBy: userId }] : [])
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        routineHacks: {
          include: {
            hack: true
          },
          orderBy: {
            position: 'asc'
          }
        },
        routineTags: {
          include: {
            tag: true
          }
        },
        userRoutines: userId ? {
          where: { userId }
        } : false,
        _count: {
          select: {
            userRoutines: {
              where: { liked: true }
            },
            routineHacks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return routines.map(routine => ({
      ...routine,
      hacks: routine.routineHacks.map(rh => ({
        ...rh.hack,
        position: rh.position
      })),
      tags: routine.routineTags.map(rt => rt.tag),
      isLiked: userId ? routine.userRoutines?.some(ur => ur.liked) : false,
      isStarted: userId ? routine.userRoutines?.some(ur => ur.started) : false,
      isCompleted: userId ? routine.userRoutines?.some(ur => ur.completed) : false,
      progress: userId ? routine.userRoutines?.[0]?.progress || 0 : 0
    }));
  } catch (error) {
    console.error('Error fetching routines:', error);
    return [];
  }
}

// Get user's own routines
export async function getUserRoutines(userId: string) {
  try {
    const routines = await prisma.routine.findMany({
      where: {
        OR: [
          { createdBy: userId },
          {
            userRoutines: {
              some: {
                userId,
                OR: [
                  { liked: true },
                  { started: true }
                ]
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        routineHacks: {
          include: {
            hack: true
          },
          orderBy: {
            position: 'asc'
          }
        },
        routineTags: {
          include: {
            tag: true
          }
        },
        userRoutines: {
          where: { userId }
        },
        _count: {
          select: {
            userRoutines: {
              where: { liked: true }
            },
            routineHacks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return routines.map(routine => ({
      ...routine,
      hacks: routine.routineHacks.map(rh => ({
        ...rh.hack,
        position: rh.position
      })),
      tags: routine.routineTags.map(rt => rt.tag),
      isLiked: routine.userRoutines?.some(ur => ur.liked) || false,
      isStarted: routine.userRoutines?.some(ur => ur.started) || false,
      isCompleted: routine.userRoutines?.some(ur => ur.completed) || false,
      progress: routine.userRoutines?.[0]?.progress || 0
    }));
  } catch (error) {
    console.error('Error fetching user routines:', error);
    return [];
  }
}

// Get a single routine by ID or slug
export async function getRoutineBySlug(slug: string) {
  try {
    const user = await getCurrentUser();

    const routine = await prisma.routine.findUnique({
      where: { slug },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        routineHacks: {
          include: {
            hack: {
              include: {
                hackTags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        routineTags: {
          include: {
            tag: true
          }
        },
        userRoutines: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            userRoutines: {
              where: { liked: true }
            },
            routineHacks: true
          }
        }
      }
    });

    if (!routine) return null;

    // Check if user has access (public or own routine)
    if (!routine.isPublic && routine.createdBy !== user?.id) {
      return null;
    }

    return {
      ...routine,
      hacks: routine.routineHacks.map(rh => ({
        ...rh.hack,
        position: rh.position,
        tags: rh.hack.hackTags.map(ht => ht.tag)
      })),
      tags: routine.routineTags.map(rt => rt.tag),
      isLiked: user ? routine.userRoutines?.some(ur => ur.liked) : false,
      isStarted: user ? routine.userRoutines?.some(ur => ur.started) : false,
      isCompleted: user ? routine.userRoutines?.some(ur => ur.completed) : false,
      progress: user ? routine.userRoutines?.[0]?.progress || 0 : 0,
      likeCount: routine._count.userRoutines
    };
  } catch (error) {
    console.error('Error fetching routine:', error);
    return null;
  }
}

// Get a single routine by ID
export async function getRoutineById(id: string) {
  try {
    const user = await getCurrentUser();

    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        routineHacks: {
          include: {
            hack: {
              include: {
                hackTags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        routineTags: {
          include: {
            tag: true
          }
        },
        userRoutines: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            userRoutines: {
              where: { liked: true }
            },
            routineHacks: true
          }
        }
      }
    });

    if (!routine) return null;

    // Check if user has access (public or own routine)
    if (!routine.isPublic && routine.createdBy !== user?.id) {
      return null;
    }

    return {
      ...routine,
      hacks: routine.routineHacks.map(rh => ({
        ...rh.hack,
        position: rh.position,
        tags: rh.hack.hackTags.map(ht => ht.tag)
      })),
      tags: routine.routineTags.map(rt => rt.tag),
      isLiked: user ? routine.userRoutines?.some(ur => ur.liked) : false,
      isStarted: user ? routine.userRoutines?.some(ur => ur.started) : false,
      isCompleted: user ? routine.userRoutines?.some(ur => ur.completed) : false,
      progress: user ? routine.userRoutines?.[0]?.progress || 0 : 0,
      likeCount: routine._count.userRoutines
    };
  } catch (error) {
    console.error('Error fetching routine:', error);
    return null;
  }
}

// Generate a unique slug for a routine
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Ensure slug is unique
export async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await prisma.routine.findFirst({
      where: {
        slug: uniqueSlug,
        ...(excludeId && { NOT: { id: excludeId } })
      }
    });

    if (!existing) {
      break;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// Calculate routine progress based on completed hacks
export async function calculateRoutineProgress(routineId: string, userId: string): Promise<number> {
  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        routineHacks: {
          select: {
            hackId: true
          }
        }
      }
    });

    if (!routine || routine.routineHacks.length === 0) {
      return 0;
    }

    const hackIds = routine.routineHacks.map(rh => rh.hackId);

    const completedHacks = await prisma.userHack.count({
      where: {
        userId,
        hackId: { in: hackIds },
        viewed: true
      }
    });

    return Math.round((completedHacks / routine.routineHacks.length) * 100);
  } catch (error) {
    console.error('Error calculating routine progress:', error);
    return 0;
  }
}

// Get public routines (for display on hacks page)
export async function getPublicRoutines() {
  try {
    const user = await getCurrentUser();

    const routines = await prisma.routine.findMany({
      where: {
        isPublic: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        routineHacks: {
          include: {
            hack: true
          },
          orderBy: {
            position: 'asc'
          }
        },
        routineTags: {
          include: {
            tag: true
          }
        },
        userRoutines: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            userRoutines: {
              where: { liked: true }
            },
            routineHacks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return routines.map(routine => ({
      ...routine,
      hacks: routine.routineHacks.map(rh => ({
        ...rh.hack,
        position: rh.position
      })),
      tags: routine.routineTags.map(rt => rt.tag),
      isLiked: user ? routine.userRoutines?.some(ur => ur.liked) : false,
      isStarted: user ? routine.userRoutines?.some(ur => ur.started) : false,
      isCompleted: user ? routine.userRoutines?.some(ur => ur.completed) : false,
      progress: user ? routine.userRoutines?.[0]?.progress || 0 : 0
    }));
  } catch (error) {
    console.error('Error fetching public routines:', error);
    return [];
  }
}