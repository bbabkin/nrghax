'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { deleteHack } from '@/lib/hacks/supabase-actions';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface Hack {
  id: string;
  name: string;
  slug?: string;
  description: string;
  image_url?: string;
  image_path?: string | null;
  content_type?: 'content' | 'link';
  difficulty?: string | null;
  timeMinutes?: number | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
}

interface SortableHackCardProps {
  hack: Hack;
}

export function SortableHackCard({ hack }: SortableHackCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hack.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHack(hack.id);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete hack:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Get image URL - same logic as HackCard
  const getImageSrc = () => {
    if (hack.image_path) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
      return `${supabaseUrl}/storage/v1/object/public/hack-images/${hack.image_path}`;
    }
    return hack.image_url || 'data:image/svg+xml,%3Csvg width="400" height="225" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const imageUrl = getImageSrc();

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-4 p-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="touch-none p-2 bg-muted hover:bg-muted/80 rounded cursor-grab active:cursor-grabbing transition-colors"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={hack.name}
              fill
              className="object-cover rounded-md"
              sizes="80px"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{hack.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {hack.description}
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-4 mt-2">
                  {hack.content_type === 'link' && (
                    <Badge variant="secondary" className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      External
                    </Badge>
                  )}
                  {hack.difficulty && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-500">
                      <Target className="h-3 w-3" />
                      {hack.difficulty}
                    </span>
                  )}
                  {hack.timeMinutes && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-500">
                      <Clock className="h-3 w-3" />
                      {hack.timeMinutes} min
                    </span>
                  )}
                </div>

                {/* Tags */}
                {hack.tags && hack.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hack.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href={`/hacks/${hack.slug || hack.id}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/admin/hacks/${hack.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{hack.name}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}