'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Users, BookOpen, Trash2, Edit, Globe, Lock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { toggleRoutineLike, deleteRoutine, startRoutine } from '@/lib/routines/actions';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/use-toast';

interface RoutineCardProps {
  routine: {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl?: string | null;
    imagePath?: string | null;
    isPublic: boolean;
    createdBy: string;
    creator: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    _count?: {
      userRoutines: number;
      routineHacks: number;
    };
    tags?: Array<{ id: string; name: string; slug: string }>;
    isLiked?: boolean;
    isStarted?: boolean;
    isCompleted?: boolean;
    progress?: number;
  };
  currentUserId?: string;
  isAdmin?: boolean;
  showActions?: boolean;
}

export function RoutineCard({
  routine,
  currentUserId,
  isAdmin = false,
  showActions = true
}: RoutineCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(routine.isLiked || false);
  const [likeCount, setLikeCount] = useState(routine._count?.userRoutines || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === routine.createdBy;
  const canEdit = isOwner || isAdmin;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like routines',
        variant: 'destructive'
      });
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await toggleRoutineLike(routine.id);
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(routine._count?.userRoutines || 0);
      console.error('Failed to toggle like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive'
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRoutine(routine.id);
      toast({
        title: 'Success',
        description: `Routine "${routine.name}" has been deleted successfully`,
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete routine:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete routine. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to start routines',
        variant: 'destructive'
      });
      return;
    }

    try {
      await startRoutine(routine.id);
      router.push(`/routines/${routine.slug}`);
    } catch (error) {
      console.error('Failed to start routine:', error);
      toast({
        title: 'Error',
        description: 'Failed to start routine',
        variant: 'destructive'
      });
    }
  };

  // Determine the image source
  const getImageSrc = () => {
    if (routine.imagePath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
      return `${supabaseUrl}/storage/v1/object/public/routine-images/${routine.imagePath}`;
    }
    return routine.imageUrl || 'data:image/svg+xml,%3Csvg width="400" height="225" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const cardContent = (
    <>
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        <Image
          src={getImageSrc()}
          alt={routine.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {routine.isPublic ? (
            <Badge className="bg-green-500">
              <Globe className="h-3 w-3 mr-1" />
              Public
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Private
            </Badge>
          )}
          {routine.isCompleted && (
            <Badge className="bg-blue-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        {routine.progress !== undefined && routine.progress > 0 && !routine.isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${routine.progress}%` }}
            />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{routine.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            by {routine.creator.name || routine.creator.email}
          </p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{routine.description}</p>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {routine._count?.routineHacks || 0} hacks
          </span>
          {routine.progress !== undefined && routine.progress > 0 && (
            <span>{routine.progress}% complete</span>
          )}
        </div>

        {/* Display tags */}
        {routine.tags && routine.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {routine.tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {tag.name}
              </span>
            ))}
            {routine.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                +{routine.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-sm"
              disabled={isLiking}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                )}
              />
              <span>{likeCount}</span>
            </button>

            {!routine.isStarted && !routine.isCompleted && currentUserId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStart}
                className="ml-2"
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Link href={`/routines/${routine.id}/edit`}>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <ConfirmDialog
                title="Delete Routine"
                description={`Are you sure you want to delete "${routine.name}"? This action cannot be undone.`}
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

  return (
    <Link href={`/routines/${routine.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {cardContent}
      </Card>
    </Link>
  );
}