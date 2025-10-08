import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TagService } from '@/lib/tags/tagService';
import { TagAssignment } from './TagAssignment';

export default async function TagAssignmentPage() {
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
  
  // Get all hacks
  const { data: hacks } = await supabase
    .from('hacks')
    .select('id, name, description')
    .order('name');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assign Tags to Hacks</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Assign tags to hacks to enable personalized recommendations.
        </p>
      </div>
      
      <TagAssignment 
        initialTags={tags} 
        initialHacks={hacks || []} 
      />
    </div>
  );
}