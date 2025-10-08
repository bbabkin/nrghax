import { getCurrentUser } from '@/lib/auth/user';
import { getRoutineBySlug, getRoutines } from '@/lib/routines/supabase-utils';
import { getHacks } from '@/lib/hacks/supabase-utils';
import { getTags } from '@/lib/tags/utils';
import { updateRoutine, reorderRoutineHacks } from '@/lib/routines/supabase-actions';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Save, Info, GripVertical, X } from 'lucide-react';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

async function getRoutineById(id: string) {
  const supabase = await createClient();
  const { data: routine } = await supabase
    .from('routines')
    .select(`
      *,
      routine_hacks (
        hack_id,
        position,
        hacks (
          id,
          name,
          description,
          difficulty,
          time_minutes
        )
      ),
      routine_tags (
        tag_id
      )
    `)
    .eq('id', id)
    .single();

  return routine;
}

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth');
  }

  const routine = await getRoutineById(resolvedParams.id);

  if (!routine) {
    notFound();
  }

  // Check if user can edit this routine
  if (routine.created_by !== user.id && !user.is_admin) {
    redirect('/dashboard/routines');
  }

  const allHacks = await getHacks();
  const tags = await getTags();

  // Get current hack IDs in order
  const currentHackIds = routine.routine_hacks
    ?.sort((a: any, b: any) => a.position - b.position)
    .map((rh: any) => rh.hack_id) || [];

  const currentTagIds = routine.routine_tags?.map((rt: any) => rt.tag_id) || [];

  async function handleUpdateRoutine(formData: FormData) {
    'use server';
    await updateRoutine(resolvedParams.id, formData);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/routines"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Routines
        </Link>

        <h1 className="text-3xl font-bold">Edit Routine</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Update your routine details and reorganize hacks
        </p>
      </div>

      <form action={handleUpdateRoutine}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update routine name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Routine Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={routine.name}
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={routine.description}
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
                  defaultValue={routine.image_url || ''}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                  Add a cover image to make your routine more appealing
                </p>
              </div>

              {user.is_admin && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    name="isPublic"
                    value="true"
                    defaultChecked={routine.is_public}
                  />
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
              <CardTitle>Selected Hacks</CardTitle>
              <CardDescription>
                Reorder or modify the hacks in your routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Currently Selected Hacks */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Current Hacks (drag to reorder)</h4>
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg min-h-[100px]">
                  {routine.routine_hacks && routine.routine_hacks.length > 0 ? (
                    routine.routine_hacks
                      .sort((a: any, b: any) => a.position - b.position)
                      .map((rh: any) => (
                        <div
                          key={rh.hack_id}
                          className="flex items-center gap-2 p-2 bg-white rounded border"
                        >
                          <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                          <Checkbox
                            name="hackIds"
                            value={rh.hack_id}
                            defaultChecked={true}
                            className="hidden"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{rh.hacks?.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-500">
                              {rh.hacks?.difficulty && (
                                <Badge variant="outline" className="text-xs mr-2">
                                  {rh.hacks.difficulty}
                                </Badge>
                              )}
                              {rh.hacks?.time_minutes && (
                                <Badge variant="outline" className="text-xs">
                                  {rh.hacks.time_minutes} min
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              const checkbox = e.currentTarget.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement;
                              if (checkbox) {
                                checkbox.checked = false;
                                e.currentTarget.parentElement?.remove();
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-300 text-center py-4">
                      No hacks selected. Add some from below.
                    </p>
                  )}
                </div>
              </div>

              {/* Available Hacks to Add */}
              <div>
                <h4 className="font-medium mb-2">Available Hacks</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                  {allHacks
                    .filter(hack => !currentHackIds.includes(hack.id))
                    .map((hack) => (
                      <div
                        key={hack.id}
                        className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
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
                          <div className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
                            {hack.description}
                          </div>
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Check/uncheck hacks to add or remove them from your routine.
                  The order matters - drag to reorder hacks in the current list.
                </p>
              </div>

              {/* Hidden inputs for existing hacks to maintain order */}
              {currentHackIds.map((hackId: string) => (
                <input
                  key={hackId}
                  type="hidden"
                  name="hackIds"
                  value={hackId}
                  className="existing-hack"
                />
              ))}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags (optional)</CardTitle>
              <CardDescription>
                Update tags to help others discover your routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-300 dark:text-gray-500">No tags available.</p>
                ) : (
                  tags.map(tag => (
                    <div key={tag.id} className="flex items-center">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        name="tagIds"
                        value={tag.id}
                        defaultChecked={currentTagIds.includes(tag.id)}
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
              <Save className="h-4 w-4 mr-2" />
              Save Changes
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