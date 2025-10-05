import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect } from '@/lib/hacks/supabase-utils';

export default async function NewHackPage() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // Get all hacks for prerequisites
  const availableHacks = await getAllHacksForSelect();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Hack</h1>
      <HackForm
        availableHacks={availableHacks}
        userId={user.id}
      />
    </div>
  );
}