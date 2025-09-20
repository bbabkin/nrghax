import { getCurrentUser } from '@/lib/auth/user';
import prisma from '@/lib/db';

export type Hack = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  imageUrl: string;
  imagePath?: string | null;
  contentType: 'content' | 'link';
  contentBody: string | null;
  externalLink: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  viewCount?: number;
  isLiked?: boolean;
  isViewed?: boolean;
  prerequisites?: Hack[];
  prerequisiteIds?: string[];
  tags?: Array<{ id: string; name: string; slug: string }>;
  difficulty?: string;
  timeMinutes?: number;
};

export async function getHacks() {
  try {
    const user = await getCurrentUser();

    const hacks = await prisma.hack.findMany({
      include: {
        hackTags: {
          include: {
            tag: true
          }
        },
        userHacks: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            userHacks: {
              where: { liked: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return hacks.map(hack => ({
      ...hack,
      tags: hack.hackTags.map(ht => ht.tag),
      likeCount: hack._count.userHacks,
      isLiked: user ? hack.userHacks?.some(uh => uh.liked) : false,
      isViewed: user ? hack.userHacks?.some(uh => uh.viewed) : false,
    }));
  } catch (error) {
    console.error('Error fetching hacks:', error);
    return [];
  }
}

export async function getHackById(id: string) {
  try {
    const user = await getCurrentUser();

    const hack = await prisma.hack.findUnique({
      where: { id },
      include: {
        hackTags: {
          include: {
            tag: true
          }
        },
        prerequisites: {
          include: {
            prerequisiteHack: true
          }
        },
        userHacks: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            userHacks: {
              where: { liked: true }
            }
          }
        }
      }
    });

    if (!hack) return null;

    const viewCount = await prisma.userHack.count({
      where: {
        hackId: hack.id,
        viewed: true
      }
    });

    return {
      ...hack,
      tags: hack.hackTags.map(ht => ht.tag),
      prerequisites: hack.prerequisites.map(p => p.prerequisiteHack),
      likeCount: hack._count.userHacks,
      viewCount,
      isLiked: user ? hack.userHacks?.some(uh => uh.liked) : false,
      isViewed: user ? hack.userHacks?.some(uh => uh.viewed) : false,
    };
  } catch (error) {
    console.error('Error fetching hack:', error);
    return null;
  }
}

export async function getHackBySlug(slug: string) {
  try {
    const user = await getCurrentUser();

    const hack = await prisma.hack.findUnique({
      where: { slug },
      include: {
        hackTags: {
          include: {
            tag: true
          }
        },
        prerequisites: {
          include: {
            prerequisiteHack: true
          }
        },
        userHacks: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            userHacks: {
              where: { liked: true }
            }
          }
        }
      }
    });

    if (!hack) return null;

    const viewCount = await prisma.userHack.count({
      where: {
        hackId: hack.id,
        viewed: true
      }
    });

    return {
      ...hack,
      tags: hack.hackTags.map(ht => ht.tag),
      prerequisites: hack.prerequisites.map(p => p.prerequisiteHack),
      likeCount: hack._count.userHacks,
      viewCount,
      isLiked: user ? hack.userHacks?.some(uh => uh.liked) : false,
      isViewed: user ? hack.userHacks?.some(uh => uh.viewed) : false,
    };
  } catch (error) {
    console.error('Error fetching hack by slug:', error);
    return null;
  }
}

export async function checkPrerequisitesCompleted(hackId: string, userId: string) {
  try {
    const hack = await prisma.hack.findUnique({
      where: { id: hackId },
      include: {
        prerequisites: true
      }
    });

    if (!hack || hack.prerequisites.length === 0) {
      return true;
    }

    const completedCount = await prisma.userHack.count({
      where: {
        userId,
        hackId: {
          in: hack.prerequisites.map(p => p.prerequisiteHackId)
        },
        viewed: true
      }
    });

    return completedCount === hack.prerequisites.length;
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    return false;
  }
}

export async function getUserProgress(userId: string) {
  try {
    const progress = await prisma.userHack.findMany({
      where: { userId },
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
        viewedAt: 'desc'
      }
    });

    return progress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
}

export async function getAllHacksForSelect() {
  try {
    const hacks = await prisma.hack.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return hacks;
  } catch (error) {
    console.error('Error fetching hacks for select:', error);
    return [];
  }
}

export async function getHackWithPrerequisites(id: string) {
  try {
    const hack = await prisma.hack.findUnique({
      where: { id },
      include: {
        prerequisites: {
          include: {
            prerequisiteHack: true
          }
        },
        hackTags: {
          include: {
            tag: true
          }
        }
      }
    });

    return hack;
  } catch (error) {
    console.error('Error fetching hack with prerequisites:', error);
    return null;
  }
}

export async function getUserCompletedHacks(userId: string) {
  try {
    const completedHacks = await prisma.userHack.findMany({
      where: {
        userId,
        viewed: true
      },
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
        viewedAt: 'desc'
      }
    });

    return completedHacks;
  } catch (error) {
    console.error('Error fetching user completed hacks:', error);
    return [];
  }
}