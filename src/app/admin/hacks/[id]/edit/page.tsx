import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HackForm } from '@/components/hacks/HackForm';
import { getHackWithPrerequisites, getAllHacksForSelect } from '@/lib/hacks/supabase-utils';

interface EditHackPageProps {
  params: {
    id: string;
  };
}

export default async function EditHackPage({ params }: EditHackPageProps) {
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

  // Get the hack to edit
  const hack = await getHackWithPrerequisites(params.id);
  if (!hack) {
    redirect('/admin/hacks');
  }

  // Get all hacks for prerequisites (excluding current hack)
  const allHacks = await getAllHacksForSelect();
  const availableHacks = allHacks.filter(h => h.id !== params.id);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Hack</h1>
      <HackForm
        hack={hack}
        availableHacks={availableHacks}
        userId={user.id}
      />
    </div>
  );
}