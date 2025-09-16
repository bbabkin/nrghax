import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect, getHackWithPrerequisites } from '@/lib/hacks/utils';
import { DeleteHackButton } from '@/components/hacks/DeleteHackButton';

export default async function EditHackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
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

  const hack = await getHackWithPrerequisites(resolvedParams.id);
  if (!hack) {
    notFound();
  }

  const availableHacks = await getAllHacksForSelect();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Hack</h1>
        <DeleteHackButton hackId={resolvedParams.id} hackName={hack.name} />
      </div>
      <HackForm hack={hack} availableHacks={availableHacks} userId={user.id} />
    </div>
  );
}