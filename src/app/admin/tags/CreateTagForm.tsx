'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateTagForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Tag name is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
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
        setError(data.error || 'Failed to create tag');
        return;
      }
      
      setName('');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      setError(error.message || 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
          Tag Name
        </label>
        <input
          id="tagName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Beginner, Energy Worker"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          This will be synced with Discord roles
        </p>
      </div>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Tag'}
      </button>
    </form>
  );
}