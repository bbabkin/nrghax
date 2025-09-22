import { getCurrentUser } from '@/lib/auth/user';
import { getHacks } from '@/lib/hacks/supabase-utils';
import { getTags } from '@/lib/tags/utils';
import { createRoutine } from '@/lib/routines/supabase-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Plus, Info } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function NewRoutinePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth');
  }

  const hacks = await getHacks();
  const tags = await getTags();

  async function handleCreateRoutine(formData: FormData) {
    'use server';
    await createRoutine(formData);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/routines"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Routines
        </Link>

        <h1 className="text-3xl font-bold">Create New Routine</h1>
        <p className="text-gray-600 mt-2">
          Organize your energy hacks into a structured routine
        </p>
      </div>

      <form action={handleCreateRoutine}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Give your routine a name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Routine Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Morning Energy Boost"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this routine is about and who it's for..."
                  required
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Cover Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add a cover image to make your routine more appealing
                </p>
              </div>

              {user.is_admin && (
                <div className="flex items-center space-x-2">
                  <Switch id="isPublic" name="isPublic" value="true" />
                  <Label htmlFor="isPublic" className="flex items-center gap-2">
                    Make this routine public
                    <Badge variant="secondary">Admin Only</Badge>
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Select Hacks */}
          <Card>
            <CardHeader>
              <CardTitle>Select Hacks</CardTitle>
              <CardDescription>
                Choose hacks to include in your routine (order matters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {hacks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hacks available. Create some hacks first.
                  </p>
                ) : (
                  hacks.map((hack, index) => (
                    <div
                      key={hack.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`hack-${hack.id}`}
                        name="hackIds"
                        value={hack.id}
                      />
                      <Label
                        htmlFor={`hack-${hack.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{hack.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {hack.description}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {hack.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {hack.difficulty}
                            </Badge>
                          )}
                          {hack.timeMinutes && (
                            <Badge variant="outline" className="text-xs">
                              {hack.timeMinutes} min
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  The order you select hacks will be the order they appear in your routine.
                  You can reorder them later.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags (optional)</CardTitle>
              <CardDescription>
                Add tags to help others discover your routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-gray-500">No tags available.</p>
                ) : (
                  tags.map(tag => (
                    <div key={tag.id} className="flex items-center">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        name="tagIds"
                        value={tag.id}
                        className="mr-2"
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="cursor-pointer"
                      >
                        <Badge variant="secondary">{tag.name}</Badge>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Create Routine
            </Button>
            <Link href="/dashboard/routines" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}