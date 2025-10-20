'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, ExternalLink, ArrowLeft, Clock } from 'lucide-react';
import { useLocalVisits } from '@/hooks/useLocalVisits';
import { VideoPlayer, type VideoPlayerRef } from '@/components/ui/VideoPlayer';
import { CommentSection } from '@/components/comments/CommentSection';
import { formatDuration } from '@/lib/youtube';
import { Checklist } from '@/components/hacks/Checklist';
import { useAuth } from '@/hooks/useAuth';

interface HackViewProps {
  hack: {
    id: string;
    name: string;
    slug?: string;
    description: string;
    imageUrl: string;
    imagePath?: string | null;
    contentType: 'content' | 'link';
    contentBody?: string | null;
    externalLink?: string | null;
    mediaType?: string | null;
    mediaUrl?: string | null;
    isViewed?: boolean;
    isLiked?: boolean;
    likeCount?: number;
    viewCount?: number;
    durationMinutes?: number | null;
    prerequisites?: Array<{
      id: string;
      name: string;
      slug?: string;
      description: string;
      imageUrl: string;
      imagePath?: string | null;
    }>;
  };
  canAccess: boolean;
  user: any;
  children?: React.ReactNode; // For the LikeButton
}

export function HackView({ hack, canAccess: serverCanAccess, user, children }: HackViewProps) {
  const { markAsVisited, visitedHacks } = useLocalVisits();
  const { isAuthenticated } = useAuth();
  const [canAccess, setCanAccess] = useState(serverCanAccess);
  const [hasMarkedVisit, setHasMarkedVisit] = useState(false);
  const [checkProgress, setCheckProgress] = useState<any>(null);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  // Memoize prerequisites check
  const prerequisiteIds = useMemo(() => {
    return hack.prerequisites?.map(p => p.id) || [];
  }, [hack.prerequisites]);

  // For anonymous users, check prerequisites client-side
  useEffect(() => {
    if (!user && prerequisiteIds.length > 0) {
      // Check if all prerequisites are visited
      const allPrerequisitesCompleted = prerequisiteIds.every(id =>
        visitedHacks.has(id)
      );
      setCanAccess(allPrerequisitesCompleted);
    } else {
      setCanAccess(serverCanAccess);
    }
  }, [user, prerequisiteIds, visitedHacks, serverCanAccess]);

  // Mark as visited when viewing the hack (for anonymous users)
  useEffect(() => {
    if (canAccess && !user && hack.contentType === 'content' && !hasMarkedVisit) {
      markAsVisited(hack.id);
      setHasMarkedVisit(true);
    }
  }, [hack.id, canAccess, user, hack.contentType, hasMarkedVisit, markAsVisited]);

  // Handle external link redirect for anonymous users
  useEffect(() => {
    if (canAccess && !user && hack.contentType === 'link' && hack.externalLink && !hasMarkedVisit) {
      // Mark as visited before redirecting
      markAsVisited(hack.id);
      setHasMarkedVisit(true);
      // Redirect after a small delay to ensure localStorage is updated
      setTimeout(() => {
        window.location.href = hack.externalLink!;
      }, 100);
    }
  }, [hack.id, canAccess, user, hack.contentType, hack.externalLink, hasMarkedVisit, markAsVisited]);

  // Check if visited from either database (authenticated) or local storage (anonymous)
  const isHackVisited = hack.isViewed || (!user && visitedHacks.has(hack.id));

  const handleCheckProgressChange = useCallback((canComplete: boolean, progress: any) => {
    setCheckProgress(progress);
  }, []);

  const getImageSrc = (imagePath?: string | null, imageUrl?: string) => {
    if (imagePath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
      return `${supabaseUrl}/storage/v1/object/public/hack-images/${imagePath}`;
    }
    return imageUrl || 'data:image/svg+xml,%3Csvg width="400" height="225" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/hacks" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Hacks
      </Link>

      {!canAccess ? (
        <Card className="p-8">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Prerequisites Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to complete the following hacks before accessing this content:
            </p>
            <div className="space-y-3 max-w-md mx-auto">
              {hack.prerequisites?.map(prereq => (
                <Link key={prereq.id} href={`/hacks/${prereq.slug || prereq.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={getImageSrc(prereq.imagePath, prereq.imageUrl)}
                          alt={prereq.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{prereq.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
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
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{hack.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">{hack.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {isHackVisited && (
                  <Badge className="bg-blue-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Visited
                  </Badge>
                )}
                {hack.contentType === 'link' && (
                  <Badge variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    External
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {children}
              {hack.durationMinutes && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(hack.durationMinutes)}</span>
                </div>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-500">
                {hack.viewCount || 0} visits
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

          {hack.mediaType && hack.mediaUrl && (
            <div className="mb-8">
              <VideoPlayer
                ref={videoPlayerRef}
                type={hack.mediaType}
                url={hack.mediaUrl}
                title={hack.name}
              />
            </div>
          )}

          {hack.contentType === 'content' && hack.contentBody && (
            <div className="p-8">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: hack.contentBody }}
              />
            </div>
          )}

          {/* Checklist */}
          <div className="p-8 pt-0">
            <Checklist
              hackId={hack.id}
              isAuthenticated={isAuthenticated}
              onProgressChange={handleCheckProgressChange}
            />
          </div>

          {/* Comments Section */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Comments</h2>
            <CommentSection
              entityType="hack"
              entityId={hack.id}
              videoRef={hack.mediaType && hack.mediaUrl ? videoPlayerRef : undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}