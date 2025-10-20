'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createLevel, updateLevel } from '@/lib/levels/adminActions';
import { Loader2 } from 'lucide-react';

interface LevelFormProps {
  level?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    position: number;
  };
}

export function LevelForm({ level }: LevelFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(level?.name || '');
  const [slug, setSlug] = useState(level?.slug || '');
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from name if not manually edited
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (!slugTouched) {
      // Auto-generate slug: lowercase, replace spaces with hyphens
      const autoSlug = newName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      setSlug(autoSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      // Validate required fields
      const name = formData.get('name') as string;
      const slug = formData.get('slug') as string;

      if (!name?.trim()) {
        throw new Error('Name is required');
      }

      if (!slug?.trim()) {
        throw new Error('Slug is required');
      }

      const data = {
        name,
        slug,
        description: (formData.get('description') as string) || null,
        icon: (formData.get('icon') as string) || null,
        position: formData.get('position')
          ? parseInt(formData.get('position') as string)
          : undefined,
      };

      if (level) {
        await updateLevel(level.id, data);
      } else {
        await createLevel(data);
      }

      router.push('/admin/levels');
      router.refresh();
    } catch (err) {
      console.error('[LevelForm] Submit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsSubmitting(false);

      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={handleNameChange}
          placeholder="Enter level name (e.g., Foundation)"
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={handleSlugChange}
          placeholder="e.g., foundation"
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          title="Only lowercase letters, numbers, and hyphens allowed"
        />
        <p className="text-sm text-gray-500 mt-1">
          URL-friendly name (auto-generated from name, or edit manually)
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={level?.description || ''}
          placeholder="Enter level description"
          rows={3}
        />
        <p className="text-sm text-gray-500 mt-1">
          Optional description shown on the level card
        </p>
      </div>

      <div>
        <Label htmlFor="icon">Icon</Label>
        <Input
          id="icon"
          name="icon"
          defaultValue={level?.icon || ''}
          placeholder="e.g., 🏆 or lucide:trophy"
        />
        <p className="text-sm text-gray-500 mt-1">
          Optional icon (emoji or lucide icon name)
        </p>
      </div>

      <div>
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          name="position"
          type="number"
          min="0"
          defaultValue={level?.position}
          placeholder="0"
        />
        <p className="text-sm text-gray-500 mt-1">
          Display order (lower numbers appear first). Leave empty to append at the end.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {level ? 'Update Level' : 'Create Level'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/levels')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
