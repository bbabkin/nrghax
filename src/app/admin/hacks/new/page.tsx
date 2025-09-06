import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect } from '@/lib/hacks/utils';

export default async function NewHackPage() {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
    
  if (!profile?.is_admin) {
    redirect('/');
  }

  const availableHacks = await getAllHacksForSelect();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Hack</h1>
      <HackForm availableHacks={availableHacks} userId={user.id} />
    </div>
  );
}