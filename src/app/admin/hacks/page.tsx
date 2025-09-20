import { requireAdmin } from '@/lib/auth/user';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HackCard } from '@/components/hacks/HackCard';
import { getHacks } from '@/lib/hacks/utils';
import { PlusCircle } from 'lucide-react';

export default async function AdminHacksPage() {
  await requireAdmin();

  const hacks = await getHacks();

  // Transform hacks to match HackCard expectations
  const transformedHacks = hacks.map(hack => ({
    id: hack.id,
    name: hack.name,
    slug: hack.slug,
    description: hack.description,
    image_url: hack.imageUrl || '',
    image_path: hack.imagePath,
    content_type: hack.contentType as 'content' | 'link',
    external_link: hack.externalLink,
    like_count: hack.likeCount,
    is_liked: hack.isLiked,
    is_completed: hack.isViewed,
    tags: hack.tags
  }));

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

      {transformedHacks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hacks created yet.</p>
          <Link href="/admin/hacks/new">
            <Button>Create Your First Hack</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformedHacks.map(hack => (
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