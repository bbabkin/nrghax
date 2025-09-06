'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextEditor } from './RichTextEditor';
import { PrerequisiteSelector } from './PrerequisiteSelector';
import { createHack, updateHack, HackFormData } from '@/lib/hacks/actions';
import { Loader2 } from 'lucide-react';

interface HackFormProps {
  hack?: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    content_type: 'content' | 'link';
    content_body: string | null;
    external_link: string | null;
    prerequisite_ids?: string[];
  };
  availableHacks: { id: string; name: string }[];
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEdit ? 'Update Hack' : 'Create Hack'}
    </Button>
  );
}

export function HackForm({ hack, availableHacks }: HackFormProps) {
  const [contentType, setContentType] = useState<'content' | 'link'>(
    hack?.content_type || 'content'
  );
  const [contentBody, setContentBody] = useState(hack?.content_body || '');
  const [prerequisites, setPrerequisites] = useState<string[]>(
    hack?.prerequisite_ids || []
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    
    const data: HackFormData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image_url: formData.get('image_url') as string,
      content_type: contentType,
      content_body: contentType === 'content' ? contentBody : null,
      external_link: contentType === 'link' ? (formData.get('external_link') as string) : null,
      prerequisite_ids: prerequisites,
    };

    try {
      if (hack) {
        await updateHack(hack.id, data);
      } else {
        await createHack(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
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
        <Label htmlFor="image_url">Image URL *</Label>
        <Input
          id="image_url"
          name="image_url"
          type="url"
          required
          defaultValue={hack?.image_url}
          placeholder="https://example.com/image.jpg"
        />
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

      <div className="flex gap-3">
        <SubmitButton isEdit={!!hack} />
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}