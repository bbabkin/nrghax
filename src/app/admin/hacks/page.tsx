import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HackCard } from '@/components/hacks/HackCard';
import { getHacks } from '@/lib/hacks/utils';
import { PlusCircle } from 'lucide-react';

export default async function AdminHacksPage() {
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

  const hacks = await getHacks();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Hacks</h1>
        <Link href="/admin/hacks/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Hack
          </Button>
        </Link>
      </div>

      {hacks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hacks created yet.</p>
          <Link href="/admin/hacks/new">
            <Button>Create Your First Hack</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hacks.map(hack => (
            <HackCard
              key={hack.id}
              hack={hack}
              isAdmin={true}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}