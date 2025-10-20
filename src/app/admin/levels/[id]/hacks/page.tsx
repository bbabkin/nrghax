import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HackAssignment } from '@/components/levels/HackAssignment';
import { getHacksByLevel, getUnassignedHacks } from '@/lib/levels/adminActions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function LevelHacksPage({
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

  // Get the level
  const { data: level, error: levelError } = await supabase
    .from('levels')
    .select('*')
    .eq('id', params.id)
    .single();

  if (levelError || !level) {
    notFound();
  }

  // Get assigned and unassigned hacks
  const [assignedHacks, unassignedHacks] = await Promise.all([
    getHacksByLevel(params.id),
    getUnassignedHacks(),
  ]);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/admin/levels">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Levels
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">
          Manage Hacks: {level.name}
        </h1>
        <p className="text-muted-foreground">
          Assign hacks to this level and reorder them by dragging.
        </p>
      </div>

      <HackAssignment
        levelId={params.id}
        levelName={level.name}
        assignedHacks={assignedHacks}
        unassignedHacks={unassignedHacks}
      />
    </div>
  );
}
