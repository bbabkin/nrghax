import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LevelForm } from '@/components/levels/LevelForm';

export default async function NewLevelPage() {
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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Level</h1>
      <LevelForm />
    </div>
  );
}
