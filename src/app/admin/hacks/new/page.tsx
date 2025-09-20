import { requireAdmin } from '@/lib/auth/user';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect } from '@/lib/hacks/utils';

export default async function NewHackPage() {
  const user = await requireAdmin();

  const availableHacks = await getAllHacksForSelect();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Hack</h1>
      <HackForm availableHacks={availableHacks} userId={user.id} />
    </div>
  );
}