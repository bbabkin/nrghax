'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/lib/tags/types';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Hack {
  id: string;
  name: string;
  description: string;
}

interface TagAssignmentProps {
  initialTags: Tag[];
  initialHacks: Hack[];
}

export function TagAssignment({ initialTags, initialHacks }: TagAssignmentProps) {
  const { toast } = useToast();
  const [selectedHacks, setSelectedHacks] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hackTags, setHackTags] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingHackId, setLoadingHackId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const filteredHacks = initialHacks.filter(hack =>
    hack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hack.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load tags for all hacks on mount
  useEffect(() => {
    loadAllHackTags();
  }, []);

  const loadAllHackTags = async () => {
    const tags: Record<string, string[]> = {};
    
    for (const hack of initialHacks) {
      try {
        const response = await fetch(`/api/admin/tags/hack/${hack.id}`);
        if (response.ok) {
          const hackTagList = await response.json();
          tags[hack.id] = hackTagList.map((t: any) => t.id);
        }
      } catch (error) {
        console.error(`Error loading tags for hack ${hack.id}:`, error);
      }
    }
    
    setHackTags(tags);
  };

  const handleHackSelect = (hackId: string) => {
    if (mode === 'single') {
      setSelectedHacks([hackId]);
      setSelectedTags(hackTags[hackId] || []);
    } else {
      if (selectedHacks.includes(hackId)) {
        setSelectedHacks(selectedHacks.filter(id => id !== hackId));
      } else {
        setSelectedHacks([...selectedHacks, hackId]);
      }
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSave = async () => {
    if (selectedHacks.length === 0) {
      toast({
        title: 'No hacks selected',
        description: 'Please select at least one hack',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      if (mode === 'single') {
        // Single hack mode - replace all tags
        const hackId = selectedHacks[0];
        const response = await fetch(`/api/admin/tags/hack/${hackId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_ids: selectedTags })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update tags');
        }
        
        setHackTags({
          ...hackTags,
          [hackId]: selectedTags
        });
        
        toast({
          title: 'Success',
          description: 'Tags updated successfully!'
        });
      } else {
        // Bulk mode - add tags to multiple hacks
        // For now, update each hack individually
        for (const hackId of selectedHacks) {
          const response = await fetch(`/api/admin/tags/hack/${hackId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag_ids: selectedTags })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update tags for hack ${hackId}`);
          }
          
          // Update local state
          setHackTags({
            ...hackTags,
            [hackId]: selectedTags
          });
        }
        
        toast({
          title: 'Success',
          description: `Tags assigned to ${selectedHacks.length} hacks successfully!`
        });
      }
      
      // Reset selection
      setSelectedHacks([]);
      setSelectedTags([]);
    } catch (error) {
      console.error('Failed to assign tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign tags. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = async (hackId: string, tagId: string, remove: boolean) => {
    setLoadingHackId(hackId);
    
    try {
      if (remove) {
        await fetch(`/api/admin/tags/hack/${hackId}/${tagId}`, {
          method: 'DELETE'
        });
        setHackTags({
          ...hackTags,
          [hackId]: hackTags[hackId].filter(id => id !== tagId)
        });
      } else {
        await fetch(`/api/admin/tags/hack/${hackId}/${tagId}`, {
          method: 'POST'
        });
        setHackTags({
          ...hackTags,
          [hackId]: [...(hackTags[hackId] || []), tagId]
        });
      }
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tag',
        variant: 'destructive'
      });
    } finally {
      setLoadingHackId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Hacks List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select Hacks</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-1 rounded ${
                    mode === 'single' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Single
                </button>
                <button
                  onClick={() => setMode('bulk')}
                  className={`px-3 py-1 rounded ${
                    mode === 'bulk' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Bulk
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search hacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {mode === 'bulk' && selectedHacks.length > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                {selectedHacks.length} hack(s) selected
              </div>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y">
            {filteredHacks.map(hack => (
              <div
                key={hack.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedHacks.includes(hack.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleHackSelect(hack.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{hack.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {hack.description}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hackTags[hack.id]?.map(tagId => {
                        const tag = initialTags.find(t => t.id === tagId);
                        return tag ? (
                          <span
                            key={tagId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded"
                          >
                            {tag.name}
                            {loadingHackId !== hack.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAssign(hack.id, tagId, true);
                                }}
                                className="hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  {mode === 'bulk' && (
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedHacks.includes(hack.id)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tags Selection */}
      <div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {mode === 'single' ? 'Assign Tags' : 'Add Tags'}
          </h2>
          
          {selectedHacks.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Select a hack to assign tags
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {initialTags.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="w-4 h-4"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
              
              <button
                onClick={handleSave}
                disabled={loading || selectedHacks.length === 0}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : `Save Tags${mode === 'bulk' ? ` to ${selectedHacks.length} Hacks` : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}