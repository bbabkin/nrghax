import { createClient } from '@/lib/supabase/server';
import { HackCard } from '@/components/hacks/HackCard';
import { getHacks } from '@/lib/hacks/utils';

export default async function HacksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const hacks = await getHacks();

  // Get user's completed hacks to check prerequisites
  let completedHackIds: string[] = [];
  if (user) {
    const { data: completions } = await supabase
      .from('user_hack_completions')
      .select('hack_id')
      .eq('user_id', user.id);
    
    completedHackIds = completions?.map(c => c.hack_id) || [];
  }

  // Get all prerequisites to check which hacks are locked
  const { data: allPrerequisites } = await supabase
    .from('hack_prerequisites')
    .select('hack_id, prerequisite_hack_id');

  const hacksWithPrerequisiteStatus = hacks.map(hack => {
    const prerequisites = allPrerequisites?.filter(p => p.hack_id === hack.id) || [];
    const hasIncompletePrerequisites = prerequisites.some(
      p => !completedHackIds.includes(p.prerequisite_hack_id)
    );
    
    return {
      ...hack,
      hasIncompletePrerequisites,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Hacks</h1>
        <p className="text-gray-600">
          Explore our collection of learning materials. Complete prerequisites to unlock advanced content.
        </p>
      </div>

      {hacks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hacks available yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hacksWithPrerequisiteStatus.map(hack => (
            <HackCard
              key={hack.id}
              hack={hack}
              hasIncompletePrerequisites={hack.hasIncompletePrerequisites}
              isAdmin={false}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}