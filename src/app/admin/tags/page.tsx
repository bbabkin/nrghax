import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TagService } from '@/lib/tags/tagService';
import { TagList } from './TagList';
import { CreateTagForm } from './CreateTagForm';

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
        <p className="text-gray-600">
          Manage tags that sync with Discord roles and organize hacks.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TagList initialTags={tags} />
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Tag</h2>
            <CreateTagForm />
          </div>
        </div>
      </div>
    </div>
  );
}