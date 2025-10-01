'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export function CreateTagForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tag name is required',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Call server action to create tag
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create tag',
          variant: 'destructive'
        });
        return;
      }
      
      setName('');
      toast({
        title: 'Success',
        description: `Tag "${name}" created successfully`
      });
      router.refresh();
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tag',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tagName" className="block text-sm font-medium mb-1">
          Tag Name
        </label>
        <input
          id="tagName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Beginner, Energy Worker"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          This will be synced with Discord roles
        </p>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Tag'}
      </button>
    </form>
  );
}