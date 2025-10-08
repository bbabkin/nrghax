'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schemas
const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
  entityType: z.enum(['hack', 'routine']),
  entityId: z.string().uuid(),
  timestampSeconds: z.number().int().min(0).optional(),
  parentId: z.string().uuid().optional(),
});

const UpdateCommentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;

interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new comment
 */
export async function createComment(
  input: CreateCommentInput
): Promise<ActionResult> {
  try {
    const validated = CreateCommentSchema.parse(input);
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: validated.content,
        entity_type: validated.entityType,
        entity_id: validated.entityId,
        timestamp_seconds: validated.timestampSeconds,
        parent_id: validated.parentId,
        user_id: user.id,
      })
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // Revalidate the entity page
    revalidatePath(`/${validated.entityType}s/${validated.entityId}`);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create comment',
    };
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  input: UpdateCommentInput
): Promise<ActionResult> {
  try {
    const validated = UpdateCommentSchema.parse(input);
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ content: validated.content })
      .eq('id', validated.id)
      .eq('user_id', user.id) // Ensure user owns the comment
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update comment',
    };
  }
}

/**
 * Soft delete a comment
 */
export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      // Admins can hard delete
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } else {
      // Regular users can soft delete their own comments
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true, content: '[deleted]' })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      error: error?.message || 'Failed to delete comment',
    };
  }
}

/**
 * Toggle like on a comment
 */
export async function toggleCommentLike(commentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true, data: { liked: false } };
    } else {
      // Like
      const { error } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: user.id });

      if (error) throw error;
      return { success: true, data: { liked: true } };
    }
  } catch (error: any) {
    console.error('Error toggling comment like:', error);
    return {
      success: false,
      error: error?.message || 'Failed to toggle like',
    };
  }
}

/**
 * Get comments for an entity
 */
export async function getComments(params: {
  entityType: 'hack' | 'routine';
  entityId: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { entityType, entityId, limit = 50, offset = 0 } = params;

    const { data: { user } } = await supabase.auth.getUser();

    // Get comments with author info and like counts
    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url
        ),
        comment_likes (
          user_id
        )
      `, { count: 'exact' })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .is('parent_id', null) // Only top-level comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              email,
              avatar_url
            ),
            comment_likes (
              user_id
            )
          `)
          .eq('parent_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          like_count: comment.comment_likes?.length || 0,
          is_liked: user ? comment.comment_likes?.some((like: any) => like.user_id === user.id) : false,
          replies: (replies || []).map((reply: any) => ({
            ...reply,
            like_count: reply.comment_likes?.length || 0,
            is_liked: user ? reply.comment_likes?.some((like: any) => like.user_id === user.id) : false,
          })),
        };
      })
    );

    return {
      success: true,
      data: {
        comments: commentsWithReplies,
        total: count,
        hasMore: count ? offset + limit < count : false,
      },
    };
  } catch (error: any) {
    console.error('Error getting comments:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get comments',
    };
  }
}
