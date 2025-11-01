import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect, getAllLevelsForSelect } from '@/lib/hacks/supabase-utils';

export default async function NewHackPage() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // Get all hacks for prerequisites and levels for assignment
  const [availableHacks, availableLevels] = await Promise.all([
    getAllHacksForSelect(),
    getAllLevelsForSelect(),
  ]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Hack</h1>
      <HackForm
        availableHacks={availableHacks}
        availableLevels={availableLevels}
        userId={user.id}
      />
    </div>
  );
}