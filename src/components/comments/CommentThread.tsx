'use client';

import { useState } from 'react';
import { MessageSquare, ThumbsUp, Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  deleteComment,
  toggleCommentLike,
  updateComment,
} from '@/lib/comments/actions';
import { CommentForm } from './CommentForm';

interface Profile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_edited: boolean | null;
  user_id: string;
  profiles: Profile;
  like_count: number;
  is_liked: boolean;
  timestamp_seconds: number | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_edited: boolean | null;
  user_id: string;
  timestamp_seconds: number | null;
  profiles: Profile;
  like_count: number;
  is_liked: boolean;
  replies?: Reply[];
}

interface CommentThreadProps {
  comment: Comment;
  entityType: 'hack' | 'routine';
  entityId: string;
  currentUserId?: string;
  videoRef?: React.RefObject<{ getCurrentTime: () => number; seekTo: (time: number) => void }>;
  onUpdate?: () => void;
}

export function CommentThread({
  comment,
  entityType,
  entityId,
  currentUserId,
  videoRef,
  onUpdate,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [localLikeCount, setLocalLikeCount] = useState(comment.like_count);
  const [localIsLiked, setLocalIsLiked] = useState(comment.is_liked);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const isOwner = currentUserId === comment.user_id;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Comment deleted successfully',
        });
        onUpdate?.();
      } else {
        throw new Error(result.error || 'Failed to delete comment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like comments',
        variant: 'destructive',
      });
      return;
    }

    setIsLiking(true);
    // Optimistic update
    setLocalIsLiked(!localIsLiked);
    setLocalLikeCount(localIsLiked ? localLikeCount - 1 : localLikeCount + 1);

    try {
      const result = await toggleCommentLike(comment.id);
      if (!result.success) {
        // Revert on error
        setLocalIsLiked(localIsLiked);
        setLocalLikeCount(comment.like_count);
        throw new Error(result.error || 'Failed to toggle like');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle like',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: 'Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateComment({
        id: comment.id,
        content: editContent.trim(),
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Comment updated successfully',
        });
        setIsEditing(false);
        onUpdate?.();
      } else {
        throw new Error(result.error || 'Failed to update comment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimestampClick = () => {
    if (comment.timestamp_seconds !== null && videoRef?.current) {
      videoRef.current.seekTo(comment.timestamp_seconds);
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.profiles.avatar_url || undefined} />
          <AvatarFallback>
            {getInitials(comment.profiles.name, comment.profiles.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {comment.profiles.name || comment.profiles.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
            {comment.timestamp_seconds !== null && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={handleTimestampClick}
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatTimestamp(comment.timestamp_seconds)}
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={localIsLiked ? 'text-primary' : ''}
            >
              <ThumbsUp className={`h-4 w-4 mr-1 ${localIsLiked ? 'fill-current' : ''}`} />
              {localLikeCount > 0 && <span>{localLikeCount}</span>}
            </Button>

            {currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}

            {isOwner && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 pl-4 border-l-2 border-border">
              <CommentForm
                entityType={entityType}
                entityId={entityId}
                parentId={comment.id}
                placeholder="Write a reply..."
                buttonText="Post Reply"
                onSuccess={() => {
                  setIsReplying(false);
                  onUpdate?.();
                }}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply as Comment}
                  entityType={entityType}
                  entityId={entityId}
                  currentUserId={currentUserId}
                  videoRef={videoRef}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
