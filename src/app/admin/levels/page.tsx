import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LevelList } from './LevelList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function AdminLevelsPage() {
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

  // Get all levels with hack counts
  const { data: levels, error } = await supabase
    .from('levels')
    .select(`
      id,
      name,
      slug,
      description,
      icon,
      position,
      hacks:hacks(count)
    `)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching levels:', error);
  }

  // Transform the data to include hack_count
  const levelsWithCount = levels?.map(level => ({
    ...level,
    hack_count: level.hacks?.[0]?.count || 0,
    hacks: undefined, // Remove the nested hacks object
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Level Management</h1>
          <p className="text-muted-foreground">
            Create and organize levels to structure the progression path.
          </p>
        </div>
        <Link href="/admin/levels/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Level
          </Button>
        </Link>
      </div>

      <LevelList levels={levelsWithCount} />
    </div>
  );
}
