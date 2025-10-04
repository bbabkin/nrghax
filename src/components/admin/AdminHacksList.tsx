'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableHackCard } from './SortableHackCard';
import { updateHackPositions } from '@/lib/hacks/supabase-actions';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Hack {
  id: string;
  name: string;
  slug?: string;
  description: string;
  imageUrl?: string;
  imagePath?: string | null;
  contentType?: 'content' | 'link';
  difficulty?: string | null;
  timeMinutes?: number | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  createdAt: string;
}

interface AdminHacksListProps {
  initialHacks: Hack[];
}

export function AdminHacksList({ initialHacks }: AdminHacksListProps) {
  const [hacks, setHacks] = useState(initialHacks);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter hacks based on search query
  const filteredHacks = searchQuery
    ? hacks.filter(
        (hack) =>
          hack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hack.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : hacks;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find the indices of the dragged items
    const oldIndex = hacks.findIndex((hack) => hack.id === active.id);
    const newIndex = hacks.findIndex((hack) => hack.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for smooth UX
    const newHacks = arrayMove(hacks, oldIndex, newIndex);
    setHacks(newHacks);

    // Save to database
    setIsSaving(true);
    try {
      const hackIds = newHacks.map((hack) => hack.id);
      await updateHackPositions(hackIds);

      toast({
        title: 'Success',
        description: 'Hack order updated successfully',
      });
    } catch (error) {
      console.error('Failed to update hack positions:', error);

      // Revert on error
      setHacks(hacks);

      toast({
        title: 'Error',
        description: 'Failed to save new order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search hacks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Saving order...
        </div>
      )}

      {/* Drag and drop list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredHacks.map((hack) => hack.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4">
            {filteredHacks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery
                    ? 'No hacks found matching your search.'
                    : 'No hacks available yet.'}
                </p>
              </div>
            ) : (
              filteredHacks.map((hack) => (
                <SortableHackCard key={hack.id} hack={hack} />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">How to reorder:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Look for the <strong>⋮⋮</strong> grip handle on the LEFT side of each card</li>
          <li>• Click and drag the grip handle to reorder hacks</li>
          <li>• The grip handle has a gray background for better visibility</li>
          <li>• Changes are saved automatically</li>
        </ul>
      </div>
    </div>
  );
}