import { HacksList } from '@/components/hacks/HacksList';
import { getHacks } from '@/lib/hacks/utils';
import { getCurrentUser } from '@/lib/auth/user';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export default async function HacksPage() {
  const user = await getCurrentUser();

  const hacks = await getHacks();

  // Get user's completed hacks to check prerequisites
  let completedHackIds: string[] = [];
  if (user) {
    // For authenticated users, get from database
    const completions = await prisma.userHack.findMany({
      where: {
        userId: user.id,
        viewed: true
      },
      select: {
        hackId: true
      }
    });

    completedHackIds = completions.map(c => c.hackId).filter((id): id is string => id !== null);
  } else {
    // For anonymous users, get from cookies
    const cookieStore = await cookies();
    const visitedCookie = cookieStore.get('visited_hacks');

    if (visitedCookie) {
      try {
        completedHackIds = JSON.parse(visitedCookie.value) as string[];
      } catch {
        completedHackIds = [];
      }
    }
  }

  // Get all prerequisites to check which hacks are locked using Prisma
  const allPrerequisites = await prisma.hackPrerequisite.findMany({
    select: {
      hackId: true,
      prerequisiteHackId: true
    }
  });

  const hacksWithPrerequisiteStatus = hacks.map(hack => {
    const prerequisites = allPrerequisites?.filter(p => p.hackId === hack.id) || [];
    const hasIncompletePrerequisites = prerequisites.some(
      p => p.prerequisiteHackId && !completedHackIds.includes(p.prerequisiteHackId)
    );

    // Get prerequisite IDs for client-side checking (for anonymous users)
    const prerequisiteIds = prerequisites
      .map(p => p.prerequisiteHackId)
      .filter((id): id is string => id !== null);

    // Transform to match HackCard expectations
    return {
      id: hack.id,
      name: hack.name,
      slug: hack.slug,
      description: hack.description,
      image_url: hack.imageUrl || '',
      image_path: hack.imagePath,
      content_type: hack.contentType as 'content' | 'link',
      external_link: hack.externalLink,
      like_count: hack.likeCount,
      is_liked: hack.isLiked,
      is_completed: hack.isViewed,
      tags: hack.tags,
      hasIncompletePrerequisites,
      prerequisiteIds, // Add prerequisite IDs for client-side checking
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Hacks</h1>
        <p className="text-gray-600">
          Explore our collection of learning materials. Complete prerequisites to unlock advanced content.
        </p>
      </div>

      <HacksList
        hacks={hacksWithPrerequisiteStatus}
        isAuthenticated={!!user}
      />
    </div>
  );
}