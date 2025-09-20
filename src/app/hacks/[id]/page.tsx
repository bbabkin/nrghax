import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getHackById, getHackBySlug, checkPrerequisitesCompleted } from '@/lib/hacks/utils';
import { markHackViewed, toggleLike } from '@/lib/hacks/actions';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Lock, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    canAccess = false;
  }

  // If it's an external link and user can access, redirect
  if (hack.content_type === 'link' && hack.external_link && canAccess) {
    // Mark as viewed before redirecting (only for authenticated users)
    if (user) {
      try {
        await markHackViewed(hack.id);
      } catch (error) {
        console.error('Failed to mark hack as viewed:', error);
        // Continue with redirect even if marking fails
      }
    }
    redirect(hack.external_link);
  }

  // Mark as viewed for internal content (only for authenticated users)
  if (hack.content_type === 'content' && canAccess && user) {
    try {
      await markHackViewed(hack.id);
    } catch (error) {
      console.error('Failed to mark hack as viewed:', error);
      // Continue showing content even if marking fails
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/hacks" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Hacks
      </Link>

      {!canAccess ? (
        <Card className="p-8">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Prerequisites Required</h1>
            <p className="text-gray-600 mb-6">
              You need to complete the following hacks before accessing this content:
            </p>
            <div className="space-y-3 max-w-md mx-auto">
              {hack.prerequisites?.map(prereq => (
                <Link key={prereq.id} href={`/hacks/${prereq.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={prereq.image_path
                            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hack-images/${prereq.image_path}`
                            : (prereq.image_url || 'data:image/svg+xml,%3Csvg width="400" height="225" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E')}
                          alt={prereq.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{prereq.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {prereq.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
            <Image
              src={hack.image_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hack-images/${hack.image_path}`
                : (hack.image_url || 'data:image/svg+xml,%3Csvg width="400" height="225" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E')}
              alt={hack.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{hack.name}</h1>
                <p className="text-gray-600">{hack.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {hack.is_completed && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {hack.content_type === 'link' && (
                  <Badge variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    External
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LikeButton 
                hackId={resolvedParams.id} 
                isLiked={hack.is_liked || false}
                likeCount={hack.like_count || 0}
              />
              <span className="text-sm text-gray-500">
                {hack.completion_count || 0} completions
              </span>
            </div>
          </div>

          {hack.prerequisites && hack.prerequisites.length > 0 && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold mb-2">Prerequisites Completed</h2>
              <div className="flex flex-wrap gap-2">
                {hack.prerequisites.map(prereq => (
                  <Badge key={prereq.id} variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {prereq.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hack.content_type === 'content' && hack.content_body && (
            <Card>
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: hack.content_body }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}