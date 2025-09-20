import { getCurrentUser } from '@/lib/auth/user';
import { redirect, notFound } from 'next/navigation';
import { getHackById, getHackBySlug, checkPrerequisitesCompleted } from '@/lib/hacks/utils';
import { markHackVisited, toggleLike } from '@/lib/hacks/actions';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { HackView } from '@/components/hacks/HackView';
import { ExternalRedirect } from '@/components/hacks/ExternalRedirect';
import { cookies } from 'next/headers';

async function LikeButton({ hackId, isLiked, likeCount }: { 
  hackId: string; 
  isLiked: boolean;
  likeCount: number;
}) {
  async function handleLike() {
    'use server';
    await toggleLike(hackId);
  }

  return (
    <form action={handleLike}>
      <Button
        type="submit"
        variant={isLiked ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-2"
      >
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
      </Button>
    </form>
  );
}

export default async function HackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();

  // Try to get hack by slug first, then by ID for backward compatibility
  let hack = await getHackBySlug(resolvedParams.id);
  if (!hack) {
    hack = await getHackById(resolvedParams.id);
  }
  if (!hack) {
    notFound();
  }

  // Check if user has completed prerequisites
  let canAccess = true;
  if (user) {
    canAccess = await checkPrerequisitesCompleted(hack.id, user.id);
  } else if (hack.prerequisites && hack.prerequisites.length > 0) {
    // For anonymous users, we'll check client-side in HackView
    // Default to false, the client will override if prerequisites are met
    canAccess = false;
  }

  // If it's an external link
  if (hack.contentType === 'link' && hack.externalLink) {
    // Track for authenticated users server-side
    if (user && canAccess) {
      try {
        await markHackVisited(hack.id);
      } catch (error) {
        console.error('Failed to mark hack as visited:', error);
      }
    }

    // Handle external links based on prerequisites
    if (user && canAccess) {
      // Authenticated user with access - use redirect component
      return <ExternalRedirect hackId={hack.id} externalUrl={hack.externalLink} />;
    } else if (!user && (!hack.prerequisites || hack.prerequisites.length === 0)) {
      // Anonymous user with no prerequisites - use redirect component
      return <ExternalRedirect hackId={hack.id} externalUrl={hack.externalLink} />;
    }
    // Otherwise, let HackView handle it (will show prerequisites page)
  }

  // Mark as viewed for internal content
  if (hack.contentType === 'content' && canAccess) {
    if (user) {
      try {
        await markHackVisited(hack.id);
      } catch (error) {
        console.error('Failed to mark hack as viewed:', error);
        // Continue showing content even if marking fails
      }
    }
    // For anonymous users, tracking happens client-side in HackView component
  }

  // The hack object already has the correct property names from Prisma
  const mappedHack = {
    ...hack,
    contentType: hack.contentType as 'content' | 'link'
  };

  return (
    <HackView
      hack={mappedHack}
      canAccess={canAccess}
      user={user}
    >
      <LikeButton
        hackId={hack.id}
        isLiked={hack.isLiked || false}
        likeCount={hack.likeCount || 0}
      />
    </HackView>
  );
}