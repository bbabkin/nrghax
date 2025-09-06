'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Lock, CheckCircle, ExternalLink, BookOpen } from 'lucide-react';
import { toggleLike } from '@/lib/hacks/actions';
import { cn } from '@/lib/utils';

interface HackCardProps {
  hack: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    content_type: 'content' | 'link';
    external_link?: string | null;
    like_count?: number;
    is_liked?: boolean;
    is_completed?: boolean;
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
  const [isLiked, setIsLiked] = useState(hack.is_liked || false);
  const [likeCount, setLikeCount] = useState(hack.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiking) return;
    
    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    
    try {
      await toggleLike(hack.id);
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(hack.like_count || 0);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const isLocked = hasIncompletePrerequisites;
  const cardContent = (
    <>
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        <Image
          src={hack.image_url}
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
        {hack.is_completed && (
          <Badge className="absolute top-2 right-2 bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{hack.name}</h3>
          {hack.content_type === 'link' ? (
            <ExternalLink className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
          ) : (
            <BookOpen className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{hack.description}</p>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
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

          {isAdmin && (
            <div className="flex gap-2">
              <Link href={`/admin/hacks/${hack.id}/edit`}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
            </div>
          )}
        </CardFooter>
      )}
    </>
  );

  if (isLocked) {
    return (
      <Card className="overflow-hidden opacity-75 cursor-not-allowed">
        {cardContent}
      </Card>
    );
  }

  return (
    <Link href={`/hacks/${hack.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {cardContent}
      </Card>
    </Link>
  );
}