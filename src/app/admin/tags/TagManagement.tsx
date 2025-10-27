'use client';

import { useState } from 'react';
import { Tag } from '@/lib/tags/types';
import { TagList } from './TagList';
import { CreateTagForm } from './CreateTagForm';

interface TagManagementProps {
  initialTags: Tag[];
}

export function TagManagement({ initialTags }: TagManagementProps) {
  const [tags, setTags] = useState(initialTags);

  const handleTagCreated = (newTag: Tag) => {
    setTags([...tags, newTag]);
  };

  const handleTagUpdated = (updatedTag: Tag) => {
    setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t));
  };

  const handleTagDeleted = (deletedTagId: string) => {
    setTags(tags.filter(t => t.id !== deletedTagId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <TagList
          tags={tags}
          onTagUpdated={handleTagUpdated}
          onTagDeleted={handleTagDeleted}
        />
      </div>

      <div>
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Tag</h2>
          <CreateTagForm onTagCreated={handleTagCreated} />
        </div>
      </div>
    </div>
  );
}
