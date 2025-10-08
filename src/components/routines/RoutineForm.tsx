'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, GripVertical, Search } from 'lucide-react';
import { createRoutine, updateRoutine } from '@/lib/routines/actions';
import { useToast } from '@/components/ui/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';

interface Hack {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty?: string | null;
  timeMinutes?: number | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface RoutineFormProps {
  routine?: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string | null;
    isPublic: boolean;
    hacks: Hack[];
    tags: Tag[];
  };
  availableHacks: Hack[];
  availableTags: Tag[];
  isAdmin?: boolean;
}

export function RoutineForm({
  routine,
  availableHacks,
  availableTags,
  isAdmin = false
}: RoutineFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [imageUrl, setImageUrl] = useState(routine?.imageUrl || '');
  const [isPublic, setIsPublic] = useState(routine?.isPublic || false);
  const [selectedHacks, setSelectedHacks] = useState<Hack[]>(routine?.hacks || []);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(routine?.tags || []);

  // Search states
  const [hackSearch, setHackSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [showHackSearch, setShowHackSearch] = useState(false);
  const [showTagSearch, setShowTagSearch] = useState(false);

  // Filter hacks and tags based on search
  const filteredHacks = availableHacks.filter(hack =>
    !selectedHacks.some(h => h.id === hack.id) &&
    (hack.name.toLowerCase().includes(hackSearch.toLowerCase()) ||
     hack.description.toLowerCase().includes(hackSearch.toLowerCase()))
  );

  const filteredTags = availableTags.filter(tag =>
    !selectedTags.some(t => t.id === tag.id) &&
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('dragIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));

    if (dragIndex === dropIndex) return;

    const newHacks = [...selectedHacks];
    const draggedHack = newHacks[dragIndex];
    newHacks.splice(dragIndex, 1);
    newHacks.splice(dropIndex, 0, draggedHack);
    setSelectedHacks(newHacks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description) {
      toast({
        title: 'Error',
        description: 'Please provide a name and description',
        variant: 'destructive'
      });
      return;
    }

    if (selectedHacks.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one hack to the routine',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('imageUrl', imageUrl);
    formData.append('isPublic', isPublic.toString());

    selectedHacks.forEach(hack => {
      formData.append('hackIds', hack.id);
    });

    selectedTags.forEach(tag => {
      formData.append('tagIds', tag.id);
    });

    try {
      let result;
      if (routine) {
        result = await updateRoutine(routine.id, formData);
      } else {
        result = await createRoutine(formData);
      }

      if (result.success) {
        // Redirect to the routine page
        router.push(`/routines/${result.slug}`);
        toast({
          title: 'Success',
          description: routine ? 'Routine updated successfully!' : 'Routine created successfully!',
        });
        return;
      } else {
        throw new Error(result.error || 'Failed to save routine');
      }
    } catch (error: any) {
      console.error('Error saving routine:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save routine. Please try again.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Routine Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Web Development Fundamentals"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this routine covers and who it's for..."
              rows={3}
              required
            />
          </div>

          <div>
            <ImageUpload
              bucket="routine-images"
              value={imageUrl}
              onChange={setImageUrl}
              label="Cover Image (optional)"
              maxSizeMB={10}
            />
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="isPublic">
                Make this routine public (visible to all users)
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hacks Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Hacks in Routine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Hacks */}
          {selectedHacks.length > 0 && (
            <div className="space-y-2">
              {selectedHacks.map((hack, index) => (
                <div
                  key={hack.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-move"
                >
                  <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                  <div className="flex-1">
                    <div className="font-medium">{hack.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {hack.description}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedHacks(selectedHacks.filter(h => h.id !== hack.id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Hack Button/Search */}
          {!showHackSearch ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHackSearch(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Hacks
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search hacks..."
                  value={hackSearch}
                  onChange={(e) => setHackSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                {filteredHacks.length > 0 ? (
                  filteredHacks.map(hack => (
                    <button
                      key={hack.id}
                      type="button"
                      onClick={() => {
                        setSelectedHacks([...selectedHacks, hack]);
                        setHackSearch('');
                      }}
                      className="w-full text-left p-2 hover:bg-muted rounded"
                    >
                      <div className="font-medium">{hack.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {hack.description}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center py-2">
                    No hacks found
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowHackSearch(false);
                  setHackSearch('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Tag Button/Search */}
          {!showTagSearch ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTagSearch(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tags
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {filteredTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags([...selectedTags, tag]);
                      setTagSearch('');
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTagSearch(false);
                  setTagSearch('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : routine ? 'Update Routine' : 'Create Routine'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}