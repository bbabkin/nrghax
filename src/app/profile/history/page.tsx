import { redirect } from 'next/navigation';
import { getUserCompletedHacks } from '@/lib/hacks/utils';
import { getCurrentUser } from '@/lib/auth/user';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, ExternalLink, BookOpen } from 'lucide-react';

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const completedHacks = await getUserCompletedHacks(user.id);

  // Group by date
  const groupedByDate = completedHacks.reduce((acc, hackData) => {
    const date = new Date(hackData.viewedAt || hackData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(hackData);
    return acc;
  }, {} as Record<string, typeof completedHacks>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning History</h1>
        <p className="text-gray-600">
          Track your learning journey and see all the hacks you&apos;ve completed.
        </p>
      </div>

      {completedHacks.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Completed Hacks Yet</h2>
            <p className="text-gray-600 mb-4">
              Start exploring our learning materials to build your knowledge!
            </p>
            <Link href="/hacks">
              <Badge className="px-4 py-2">
                Browse Hacks →
              </Badge>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                {completedHacks.length} {completedHacks.length === 1 ? 'Hack' : 'Hacks'} Completed
              </span>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(groupedByDate).map(([date, hacks]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-700">{date}</h2>
                </div>
                
                <div className="space-y-3">
                  {hacks.map((hack) => (
                    <Link key={hack.id} href={`/hacks/${hack.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <Image
                                src={hack.image_path
                                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hack-images/${hack.image_path}`
                                  : hack.image_url || '/placeholder-hack.svg'}
                                alt={hack.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{hack.name}</h3>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {hack.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {hack.content_type === 'link' ? (
                                    <Badge variant="outline" className="text-xs">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      External
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      Content
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                Completed at {new Date(hack.viewedAt || hack.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}