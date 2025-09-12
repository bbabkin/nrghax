'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Tags } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface TagSelectorProps {
  hackId?: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ hackId, selectedTags, onTagsChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
    if (hackId) {
      loadHackTags();
    }
  }, [hackId]);

  const loadTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      if (!response.ok) throw new Error('Failed to load tags');
      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError('Failed to load tags');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHackTags = async () => {
    if (!hackId) return;
    
    try {
      const response = await fetch(`/api/admin/tags/hack/${hackId}`);
      if (response.ok) {
        const hackTags = await response.json();
        const tagIds = hackTags.map((t: any) => t.id);
        onTagsChange(tagIds);
      }
    } catch (err) {
      console.error('Failed to load hack tags:', err);
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No tags available. Create tags in the admin panel first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4" />
        <Label>Tags</Label>
      </div>
      
      <ScrollArea className="h-48 w-full rounded-md border p-4">
        <div className="grid grid-cols-2 gap-3">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={tag.id}
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={() => handleTagToggle(tag.id)}
              />
              <label
                htmlFor={tag.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <Badge variant="outline" style={{ backgroundColor: tag.color || undefined }}>
                  {tag.name}
                </Badge>
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Selected tags ({selectedTags.length}):
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <Badge key={tagId} variant="default">
                  {tag.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}