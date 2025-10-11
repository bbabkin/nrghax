'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Lock, CheckCircle, ExternalLink, BookOpen, Trash2, Eye, Clock } from 'lucide-react';
import { toggleLike, deleteHack } from '@/lib/hacks/actions';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLocalVisits } from '@/hooks/useLocalVisits';
import { useAuth } from '@/hooks/useAuth';
import { formatDuration } from '@/lib/youtube';

interface HackCardProps {
  hack: {
    id: string;
    name: string;
    slug?: string;
    description: string;
    image_url: string;
    image_path?: string | null;
    content_type: 'content' | 'link';
    external_link?: string | null;
    like_count?: number;
    view_count?: number;
    is_liked?: boolean;
    is_completed?: boolean;
    duration_minutes?: number | null;
    tags?: Array<{ id: string; name: string; slug: string }>;
  };
  hasIncompletePrerequisites?: boolean;
  isAdmin?: boolean;
  showActions?: boolean;
}

export function HackCard({
  hack,
  hasIncompletePrerequisites = false,
  isAdmin = false,
  showActions = true
}: HackCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isVisited } = useLocalVisits();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(hack.is_liked || false);
  const [likeCount, setLikeCount] = useState(hack.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if visited from either database (authenticated) or local storage (anonymous)
  const isHackVisited = hack.is_completed || isVisited(hack.id);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like hacks',
      });
      // Redirect to auth page
      router.push('/auth');
      return;
    }

    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await toggleLike(hack.id);
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(hack.like_count || 0);
      toast({
        title: 'Error',
        description: 'Failed to update like status. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHack(hack.id);
      toast({
        title: 'Success',
        description: `Hack "${hack.name}" has been deleted successfully`,
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete hack:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete hack. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const isLocked = hasIncompletePrerequisites;
  
  // Determine the image source - prioritize image_path from storage
  const getImageSrc = () => {
    if (hack.image_path) {
      // Use Supabase storage URL - use env variable for proper URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
      return `${supabaseUrl}/storage/v1/object/public/hack-images/${hack.image_path}`;
    }
    // Fallback to image_url or a data URL placeholder if null
    return hack.image_url || 'data:image/svg+xml,%3Csvg width="400" height="225" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  };
  
  const cardContent = (
    <>
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        <Image
          src={getImageSrc()}
          alt={hack.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isLocked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Lock className="h-12 w-12 text-white" />
          </div>
        )}
        {isHackVisited && (
          <Badge className="absolute top-2 right-2 bg-blue-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Visited
          </Badge>
        )}
        {hack.view_count && hack.view_count > 1 && (
          <Badge className="absolute top-2 right-20 bg-gray-700 text-white">
            <Eye className="h-3 w-3 mr-1" />
            x{hack.view_count}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{hack.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {hack.content_type === 'link' && (
                <p className="text-xs text-gray-500 dark:text-gray-300">External Link</p>
              )}
              {hack.duration_minutes && (
                <>
                  {hack.content_type === 'link' && <span className="text-xs text-gray-400">•</span>}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
                    <Clock className="h-3 w-3" />
                    {formatDuration(hack.duration_minutes)}
                  </div>
                </>
              )}
            </div>
          </div>
          {hack.content_type === 'link' ? (
            <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-300 flex-shrink-0 ml-2" />
          ) : (
            <BookOpen className="h-4 w-4 text-gray-500 dark:text-gray-300 flex-shrink-0 ml-2" />
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-500 line-clamp-2">{hack.description}</p>

        {/* Display tags as pills below description */}
        {hack.tags && hack.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {hack.tags.map(tag => (
              <span
                key={tag.id}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1 text-sm",
              !isAuthenticated && "hover:opacity-70"
            )}
            disabled={isLiking}
            title={!isAuthenticated ? "Sign in to like" : undefined}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isLiked && isAuthenticated ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-300 dark:text-gray-500"
              )}
            />
            <span>{likeCount}</span>
          </button>

          {isAdmin && (
            <div className="flex gap-2">
              <Link href={`/admin/hacks/${hack.id}/edit`}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
              <ConfirmDialog
                title="Delete Hack"
                description={`Are you sure you want to delete "${hack.name}"? This will also remove all user progress and cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
              >
                {({ onClick }) => (
                  <Button
                    onClick={onClick}
                    size="sm"
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </ConfirmDialog>
            </div>
          )}
        </CardFooter>
      )}
    </>
  );

  if (isLocked) {
    return (
      <Link href={`/hacks/${hack.slug || hack.id}`}>
        <div className="opacity-75 hover:opacity-90 hover:-translate-y-2 transition-all duration-500" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}>
          <Card className="border-0 overflow-hidden cursor-pointer transition-all duration-500 md:[clip-path:polygon(25px_0,100%_0,100%_calc(100%-25px),calc(100%-25px)_100%,0_100%,0_25px)] xl:[clip-path:polygon(35px_0,100%_0,100%_calc(100%-35px),calc(100%-35px)_100%,0_100%,0_35px)]" style={{ clipPath: 'polygon(35px 0, 100% 0, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0 100%, 0 35px)' }}>
            {cardContent}
          </Card>
        </div>
      </Link>
    );
  }

  // For admin cards, make the card clickable by wrapping the title in a Link
  if (isAdmin && showActions) {
    return (
      <Link href={`/hacks/${hack.slug || hack.id}`}>
        <div className="hover:-translate-y-2 transition-all duration-500" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))' }}>
          <Card className="border-0 overflow-hidden cursor-pointer transition-all duration-500 md:[clip-path:polygon(25px_0,100%_0,100%_calc(100%-25px),calc(100%-25px)_100%,0_100%,0_25px)] xl:[clip-path:polygon(35px_0,100%_0,100%_calc(100%-35px),calc(100%-35px)_100%,0_100%,0_35px)]" style={{ clipPath: 'polygon(35px 0, 100% 0, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0 100%, 0 35px)' }}>
            {cardContent}
          </Card>
        </div>
      </Link>
    );
  }

  // For external links, use normal navigation to intermediate page (which will open in new tab)
  if (hack.content_type === 'link' && hack.external_link) {
    return (
      <Link href={`/hacks/${hack.slug || hack.id}`}>
        <div className="hover:-translate-y-2 hover:[filter:drop-shadow(0_10px_15px_rgba(0,0,0,0.15))_drop-shadow(0_20px_25px_rgba(0,0,0,0.1))] transition-all duration-500" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))' }}>
          <Card className="border-0 overflow-hidden cursor-pointer transition-all duration-500 md:[clip-path:polygon(25px_0,100%_0,100%_calc(100%-25px),calc(100%-25px)_100%,0_100%,0_25px)] xl:[clip-path:polygon(35px_0,100%_0,100%_calc(100%-35px),calc(100%-35px)_100%,0_100%,0_35px)]" style={{ clipPath: 'polygon(35px 0, 100% 0, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0 100%, 0 35px)' }}>
            {cardContent}
          </Card>
        </div>
      </Link>
    );
  }

  // For internal content, use Next.js Link normally
  return (
    <Link href={`/hacks/${hack.slug || hack.id}`}>
      <div className="hover:-translate-y-2 hover:[filter:drop-shadow(0_10px_15px_rgba(0,0,0,0.15))_drop-shadow(0_20px_25px_rgba(0,0,0,0.1))] transition-all duration-500" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))' }}>
        <Card className="border-0 overflow-hidden cursor-pointer transition-all duration-500 md:[clip-path:polygon(25px_0,100%_0,100%_calc(100%-25px),calc(100%-25px)_100%,0_100%,0_25px)] xl:[clip-path:polygon(35px_0,100%_0,100%_calc(100%-35px),calc(100%-35px)_100%,0_100%,0_35px)]" style={{ clipPath: 'polygon(35px 0, 100% 0, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0 100%, 0 35px)' }}>
          {cardContent}
        </Card>
      </div>
    </Link>
  );
}
