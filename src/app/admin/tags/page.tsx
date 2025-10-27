import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TagService } from '@/lib/tags/tagService';
import { TagManagement } from './TagManagement';

export default async function AdminTagsPage() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // Get all tags
  const tags = await TagService.getAllTags();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tag Management</h1>
        <p className="text-muted-foreground">
          Manage tags that sync with Discord roles and organize hacks.
        </p>
      </div>

      <TagManagement initialTags={tags} />
    </div>
  );
}