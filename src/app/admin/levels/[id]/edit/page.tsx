import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LevelForm } from '@/components/levels/LevelForm';
import { notFound } from 'next/navigation';

export default async function EditLevelPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // Get the level to edit
  const { data: level, error } = await supabase
    .from('levels')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !level) {
    notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Level: {level.name}</h1>
      <LevelForm level={level} />
    </div>
  );
}
