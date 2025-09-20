import { requireAdmin } from '@/lib/auth/user';
import { redirect, notFound } from 'next/navigation';
import { HackForm } from '@/components/hacks/HackForm';
import { getAllHacksForSelect, getHackWithPrerequisites } from '@/lib/hacks/utils';
import { DeleteHackButton } from '@/components/hacks/DeleteHackButton';

export default async function EditHackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await requireAdmin();

  const hack = await getHackWithPrerequisites(resolvedParams.id);
  if (!hack) {
    notFound();
  }

  const availableHacks = await getAllHacksForSelect();

  // Transform hack to match HackForm expectations
  const hackFormData = {
    id: hack.id,
    name: hack.name,
    description: hack.description,
    image_url: hack.imageUrl || '',
    image_path: hack.imagePath,
    content_type: hack.contentType as 'content' | 'link',
    content_body: hack.contentBody || null,
    external_link: hack.externalLink || null,
    difficulty: hack.difficulty,
    time_minutes: hack.timeMinutes,
    prerequisite_ids: hack.prerequisites?.map(p => p.prerequisiteHackId).filter(Boolean) as string[] || []
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Hack</h1>
        <DeleteHackButton hackId={resolvedParams.id} hackName={hack.name} />
      </div>
      <HackForm hack={hackFormData} availableHacks={availableHacks} userId={user.id} />
    </div>
  );
}