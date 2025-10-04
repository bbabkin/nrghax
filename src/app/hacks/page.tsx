import { HacksPageContent } from '@/components/hacks/HacksPageContent';
import { getHacks, getUserCompletedHackIds, getHackPrerequisites } from '@/lib/hacks/supabase-utils';
import { getPublicRoutines, getUserRoutines } from '@/lib/routines/supabase-utils';
import { getCurrentUser } from '@/lib/auth/user';
import { cookies } from 'next/headers';

export default async function HacksPage() {
  const user = await getCurrentUser();

  // Debug logging
  console.log('[HacksPage] Current user:', user ? {
    email: user.email,
    is_admin: user.is_admin,
    id: user.id
  } : 'null');

  // Fetch hacks
  const hacks = await getHacks();

  // Fetch public routines
  const routines = await getPublicRoutines();

  // Fetch user's own routines if authenticated
  let userRoutines: any[] = [];
  if (user) {
    userRoutines = await getUserRoutines(user.id);
  }

  // Get user's completed hacks to check prerequisites
  let completedHackIds: string[] = [];
  if (user) {
    // For authenticated users, get from database
    completedHackIds = await getUserCompletedHackIds(user.id);
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

  // Get all prerequisites to check which hacks are locked
  const allPrerequisites = await getHackPrerequisites();

  const hacksWithPrerequisiteStatus = hacks.map(hack => {
    const prerequisites = allPrerequisites?.filter(p => p.hack_id === hack.id) || [];
    const hasIncompletePrerequisites = prerequisites.some(
      p => p.prerequisite_hack_id && !completedHackIds.includes(p.prerequisite_hack_id)
    );

    // Get prerequisite IDs for client-side checking (for anonymous users)
    const prerequisiteIds = prerequisites
      .map(p => p.prerequisite_hack_id)
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
      view_count: hack.viewCount,
      is_liked: hack.isLiked,
      is_completed: hack.isViewed,
      tags: hack.tags,
      hasIncompletePrerequisites,
      prerequisiteIds, // Add prerequisite IDs for client-side checking
      created_at: hack.createdAt,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Resources</h1>
        <p className="text-gray-600">
          Explore our collection of hacks and curated routines. Start your learning journey today.
        </p>
      </div>

      <HacksPageContent
        hacks={hacksWithPrerequisiteStatus}
        routines={routines}
        userRoutines={userRoutines}
        isAuthenticated={!!user}
        currentUserId={user?.id}
        isAdmin={user?.is_admin || false}
      />

    </div>
  );
}