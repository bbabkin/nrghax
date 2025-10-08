-- Create enum for entity types
CREATE TYPE comment_entity_type AS ENUM ('hack', 'routine');

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER, -- Optional video timestamp in seconds
  entity_type comment_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For nested replies
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false, -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  edited_at TIMESTAMPTZ
);

-- Create comment_likes table
CREATE TABLE public.comment_likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY(user_id, comment_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_user ON public.comments(user_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_parent ON public.comments(parent_id) WHERE parent_id IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_comments_timestamp ON public.comments(timestamp_seconds) WHERE timestamp_seconds IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_comment_likes_comment ON public.comment_likes(comment_id);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments

-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view non-deleted comments"
  ON public.comments FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own comments, admins can hard delete
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for comment_likes

-- Anyone can view likes
CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes FOR SELECT
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike comments
CREATE POLICY "Users can unlike comments"
  ON public.comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.is_edited = true;
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Create function to get comment count for an entity
CREATE OR REPLACE FUNCTION get_comment_count(
  p_entity_type comment_entity_type,
  p_entity_id UUID
)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.comments
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND is_deleted = false;
$$ LANGUAGE SQL STABLE;

-- Create function to get like count for a comment
CREATE OR REPLACE FUNCTION get_comment_like_count(p_comment_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.comment_likes
  WHERE comment_id = p_comment_id;
$$ LANGUAGE SQL STABLE;
