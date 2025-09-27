'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextEditor } from './RichTextEditor';
import { PrerequisiteSelector } from './PrerequisiteSelector';
import { TagSelector } from './TagSelector';
import { createHackWithImage, updateHackWithImage } from '@/lib/hacks/client-actions';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { MediaInput } from '@/components/ui/media-input';

interface HackFormProps {
  hack?: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    image_path?: string | null;
    content_type: 'content' | 'link';
    content_body: string | null;
    external_link: string | null;
    media_type?: string | null;
    media_url?: string | null;
    media_thumbnail_url?: string | null;
    prerequisite_ids?: string[];
  };
  availableHacks: { id: string; name: string }[];
  userId: string;
}

export function HackForm({ hack, availableHacks, userId }: HackFormProps) {
  const router = useRouter();
  const [contentType, setContentType] = useState<'content' | 'link'>(
    hack?.content_type || 'content'
  );
  const [contentBody, setContentBody] = useState(hack?.content_body || '');
  const [prerequisites, setPrerequisites] = useState<string[]>(
    hack?.prerequisite_ids || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState(hack?.media_type || '');
  const [mediaUrl, setMediaUrl] = useState(hack?.media_url || '');
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    hack?.image_url || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(hack?.image_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      // Validate required fields
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      
      if (!name?.trim()) {
        throw new Error('Name is required');
      }
      
      if (!description?.trim()) {
        throw new Error('Description is required');
      }
      
      // Check if we have an image
      if (!imageFile && !hack?.image_path && !hack?.image_url) {
        throw new Error('Please select an image');
      }
      
      console.log('[HackForm] Submitting form with data:', {
        name,
        description,
        hasImageFile: !!imageFile,
        contentType,
        userId
      });
      
      const data = {
        name,
        description,
        imageFile,
        existingImagePath: hack?.image_path || undefined,
        existingImageUrl: hack?.image_url || undefined,
        content_type: contentType,
        content_body: contentType === 'content' ? contentBody : null,
        external_link: contentType === 'link' ? (formData.get('external_link') as string) : null,
        media_type: mediaType || null,
        media_url: mediaUrl || null,
        prerequisite_ids: prerequisites,
      };

      let hackId: string;
      if (hack) {
        await updateHackWithImage(hack.id, data, userId);
        hackId = hack.id;
      } else {
        const result = await createHackWithImage(data, userId);
        hackId = result.id;
      }
      
      // Save tags if any are selected
      if (selectedTags.length > 0 || hack) {
        await fetch(`/api/admin/tags/hack/${hackId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_ids: selectedTags })
        });
      }
      
      router.push('/admin/hacks');
      router.refresh();
    } catch (err) {
      console.error('[HackForm] Submit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsUploading(false);
      
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
          defaultValue={hack?.name}
          placeholder="Enter hack name"
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={hack?.description}
          placeholder="Enter hack description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="image">Image *</Label>
        <div className="space-y-2">
          {imagePreview && (
            <div className="relative w-full max-w-md">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized={imageFile !== null}
                />
              </div>
              {imageFile && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {!imageFile && !imagePreview && (
              <ImageIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">
            {imageFile ? 
              `Selected: ${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)}MB)` : 
              'Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)'
            }
          </p>
        </div>
      </div>

      <div>
        <Label>Content Type *</Label>
        <RadioGroup
          value={contentType}
          onValueChange={(value) => setContentType(value as 'content' | 'link')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="content" id="content" />
            <Label htmlFor="content">Internal Content</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" id="link" />
            <Label htmlFor="link">External Link</Label>
          </div>
        </RadioGroup>
      </div>

      {contentType === 'content' ? (
        <div>
          <Label>Content *</Label>
          <RichTextEditor
            content={contentBody}
            onChange={setContentBody}
            placeholder="Enter hack content..."
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="external_link">External Link *</Label>
          <Input
            id="external_link"
            name="external_link"
            type="url"
            required={contentType === 'link'}
            defaultValue={hack?.external_link || ''}
            placeholder="https://example.com/resource"
          />
        </div>
      )}

      <div>
        <Label>Prerequisites</Label>
        <PrerequisiteSelector
          availableHacks={availableHacks}
          selectedIds={prerequisites}
          onChange={setPrerequisites}
          currentHackId={hack?.id}
        />
      </div>

      <div>
        <MediaInput
          mediaType={mediaType}
          mediaUrl={mediaUrl}
          onTypeChange={setMediaType}
          onUrlChange={setMediaUrl}
          label="Embedded Media (Optional)"
        />
      </div>

      <div>
        <TagSelector
          hackId={hack?.id}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isUploading}>
        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {hack ? 'Update Hack' : 'Create Hack'}
      </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}