'use client';

import { useState } from 'react';
import { Tag } from '@/lib/tags/types';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/ui/confirmation-dialog';

interface TagListProps {
  initialTags: Tag[];
}

export function TagList({ initialTags }: TagListProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState(initialTags);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  const handleSave = async (id: string) => {
    if (!editingName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName }),
      });
      
      if (response.ok) {
        setTags(tags.map(t => t.id === id ? { ...t, name: editingName } : t));
        setEditingId(null);
        toast({
          title: 'Success',
          description: `Tag updated to "${editingName}"`
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update tag. It may already exist.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tag.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deletedTag = tags.find(t => t.id === id);
        setTags(tags.filter(t => t.id !== id));
        toast({
          title: 'Success',
          description: `Tag "${deletedTag?.name}" deleted successfully`
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete tag. It may be in use.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tag.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-4">All Tags</h2>
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
      </div>
      
      <div className="divide-y">
        {filteredTags.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {searchQuery ? 'No tags found matching your search.' : 'No tags created yet.'}
          </div>
        ) : (
          filteredTags.map(tag => (
            <div key={tag.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
              {editingId === tag.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleSave(tag.id)}
                    disabled={loading}
                    className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="p-1 text-muted-foreground hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="font-medium">{tag.name}</div>
                    <div className="text-sm text-muted-foreground">{tag.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <ConfirmDialog
                      title="Delete Tag"
                      description={`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`}
                      confirmText="Delete"
                      cancelText="Cancel"
                      onConfirm={() => handleDelete(tag.id)}
                      variant="destructive"
                    >
                      {({ onClick }) => (
                        <button
                          onClick={onClick}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </ConfirmDialog>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      {filteredTags.length > 0 && (
        <div className="p-4 border-t text-sm text-muted-foreground">
          Showing {filteredTags.length} of {tags.length} tags
        </div>
      )}
    </div>
  );
}