import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect, getHackWithPrerequisites } from '@/lib/hacks/utils';
import { Button } from '@/components/ui/button';
import { deleteHack } from '@/lib/hacks/actions';
import { Trash2 } from 'lucide-react';

async function DeleteButton({ hackId }: { hackId: string }) {
  async function handleDelete() {
    'use server';
    await deleteHack(hackId);
    redirect('/admin/hacks');
  }

  return (
    <form action={handleDelete}>
      <Button type="submit" variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Hack
      </Button>
    </form>
  );
}

export default async function EditHackPage({ params }: { params: { id: string } }) {
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

  const hack = await getHackWithPrerequisites(params.id);
  if (!hack) {
    notFound();
  }

  const availableHacks = await getAllHacksForSelect();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Hack</h1>
        <DeleteButton hackId={params.id} />
      </div>
      <HackForm hack={hack} availableHacks={availableHacks} />
    </div>
  );
}