'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Send } from 'lucide-react';
import { createComment, type CreateCommentInput } from '@/lib/comments/actions';
import { useToast } from '@/components/ui/use-toast';

interface CommentFormProps {
  entityType: 'hack' | 'routine';
  entityId: string;
  parentId?: string;
  videoRef?: React.RefObject<{ getCurrentTime: () => number }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
}

export function CommentForm({
  entityType,
  entityId,
  parentId,
  videoRef,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
  buttonText = 'Post Comment',
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [useTimestamp, setUseTimestamp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCaptureTimestamp = () => {
    if (videoRef?.current) {
      const currentTime = videoRef.current.getCurrentTime();
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      setTimestamp(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      setUseTimestamp(true);
    }
  };

  const parseTimestamp = (ts: string): number | undefined => {
    if (!ts) return undefined;
    const parts = ts.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds;
      }
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateCommentInput = {
        content: content.trim(),
        entityType,
        entityId,
        parentId,
      };

      if (useTimestamp && timestamp) {
        const timestampSeconds = parseTimestamp(timestamp);
        if (timestampSeconds !== undefined) {
          input.timestampSeconds = timestampSeconds;
        }
      }

      const result = await createComment(input);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Comment posted successfully',
        });
        setContent('');
        setTimestamp('');
        setUseTimestamp(false);
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to post comment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] resize-none"
        disabled={isSubmitting}
      />

      {videoRef && !parentId && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-timestamp"
              checked={useTimestamp}
              onChange={(e) => setUseTimestamp(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="use-timestamp" className="text-sm">
              Add timestamp
            </Label>
          </div>

          {useTimestamp && (
            <>
              <Input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="MM:SS"
                className="w-24"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCaptureTimestamp}
              >
                <Clock className="h-4 w-4 mr-1" />
                Capture
              </Button>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Posting...' : buttonText}
        </Button>
      </div>
    </form>
  );
}
