'use client';

import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getComments } from '@/lib/comments/actions';
import { createClient } from '@/lib/supabase/client';
import { CommentForm } from './CommentForm';
import { CommentThread } from './CommentThread';

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

interface CommentSectionProps {
  entityType: 'hack' | 'routine';
  entityId: string;
  videoRef?: React.RefObject<{ getCurrentTime: () => number; seekTo: (time: number) => void }>;
}

export function CommentSection({
  entityType,
  entityId,
  videoRef,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const limit = 10;

  useEffect(() => {
    // Get current user
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  const fetchComments = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      setLoadingMore(!reset);

      const result = await getComments({
        entityType,
        entityId,
        limit,
        offset: currentOffset,
      });

      if (result.success && result.data) {
        if (reset) {
          setComments(result.data.comments);
          setOffset(limit);
        } else {
          setComments((prev) => [...prev, ...result.data.comments]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(result.data.hasMore);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch comments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const handleCommentSuccess = () => {
    // Refresh comments after posting
    setOffset(0);
    fetchComments(true);
  };

  const handleUpdate = () => {
    // Refresh comments after edit/delete
    setOffset(0);
    fetchComments(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </h3>
        <Separator />
        <div className="text-center py-8 text-muted-foreground">
          Loading comments...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </h3>
        <Separator />
        <div className="text-center py-8 text-destructive">
          Error loading comments: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
        <Separator />
      </div>

      {currentUserId ? (
        <div className="bg-muted/30 p-4 rounded-lg">
          <CommentForm
            entityType={entityType}
            entityId={entityId}
            videoRef={videoRef}
            onSuccess={handleCommentSuccess}
            placeholder="Share your thoughts..."
            buttonText="Post Comment"
          />
        </div>
      ) : (
        <div className="bg-muted/30 p-4 rounded-lg text-center text-muted-foreground">
          <p>Sign in to leave a comment</p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No comments yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              entityType={entityType}
              entityId={entityId}
              currentUserId={currentUserId}
              videoRef={videoRef}
              onUpdate={handleUpdate}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchComments(false)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More Comments'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
