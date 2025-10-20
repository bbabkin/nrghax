'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Plus } from 'lucide-react';
import {
  assignHackToLevel,
  removeHackFromLevel,
  updateHackPositions,
} from '@/lib/levels/adminActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Hack {
  id: string;
  name: string;
  slug: string;
  position: number;
}

interface HackAssignmentProps {
  levelId: string;
  levelName: string;
  assignedHacks: Hack[];
  unassignedHacks: { id: string; name: string; slug: string }[];
}

function SortableHack({
  hack,
  onRemove,
}: {
  hack: Hack;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: hack.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-card border rounded-lg p-3 hover:bg-muted/50"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{hack.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{hack.slug}</div>
      </div>
      <div className="text-sm text-muted-foreground">Position: {hack.position}</div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(hack.id)}
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function HackAssignment({
  levelId,
  levelName,
  assignedHacks: initialAssignedHacks,
  unassignedHacks: initialUnassignedHacks,
}: HackAssignmentProps) {
  const router = useRouter();
  const [assignedHacks, setAssignedHacks] = useState(initialAssignedHacks);
  const [unassignedHacks, setUnassignedHacks] = useState(initialUnassignedHacks);
  const [selectedHack, setSelectedHack] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = assignedHacks.findIndex((h) => h.id === active.id);
      const newIndex = assignedHacks.findIndex((h) => h.id === over.id);

      const reorderedHacks = arrayMove(assignedHacks, oldIndex, newIndex);

      // Update positions based on new order
      const hacksWithNewPositions = reorderedHacks.map((hack, index) => ({
        ...hack,
        position: index,
      }));

      setAssignedHacks(hacksWithNewPositions);

      // Save to database
      setIsUpdating(true);
      try {
        await updateHackPositions(
          hacksWithNewPositions.map((hack) => ({
            hackId: hack.id,
            position: hack.position,
          }))
        );
        router.refresh();
      } catch (error) {
        console.error('Error updating positions:', error);
        // Revert on error
        setAssignedHacks(assignedHacks);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleAssignHack = async () => {
    if (!selectedHack) return;

    const hackToAssign = unassignedHacks.find((h) => h.id === selectedHack);
    if (!hackToAssign) return;

    setIsUpdating(true);
    try {
      // Assign with position at the end
      const newPosition = assignedHacks.length;
      await assignHackToLevel(selectedHack, levelId, newPosition);

      // Update local state
      setAssignedHacks([
        ...assignedHacks,
        { ...hackToAssign, position: newPosition },
      ]);
      setUnassignedHacks(unassignedHacks.filter((h) => h.id !== selectedHack));
      setSelectedHack('');

      router.refresh();
    } catch (error) {
      console.error('Error assigning hack:', error);
      alert('Failed to assign hack');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveHack = async (hackId: string) => {
    const hackToRemove = assignedHacks.find((h) => h.id === hackId);
    if (!hackToRemove) return;

    if (!confirm(`Remove "${hackToRemove.name}" from this level?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await removeHackFromLevel(hackId);

      // Update local state
      const remainingHacks = assignedHacks
        .filter((h) => h.id !== hackId)
        .map((hack, index) => ({ ...hack, position: index }));

      setAssignedHacks(remainingHacks);
      setUnassignedHacks([...unassignedHacks, hackToRemove]);

      // Update positions in database
      if (remainingHacks.length > 0) {
        await updateHackPositions(
          remainingHacks.map((hack) => ({
            hackId: hack.id,
            position: hack.position,
          }))
        );
      }

      router.refresh();
    } catch (error) {
      console.error('Error removing hack:', error);
      alert('Failed to remove hack');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Add Hack to {levelName}</h2>
        <div className="flex gap-2">
          <Select value={selectedHack} onValueChange={setSelectedHack}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a hack to add..." />
            </SelectTrigger>
            <SelectContent>
              {unassignedHacks.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No unassigned hacks available
                </div>
              ) : (
                unassignedHacks.map((hack) => (
                  <SelectItem key={hack.id} value={hack.id}>
                    {hack.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAssignHack}
            disabled={!selectedHack || isUpdating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">
          Assigned Hacks ({assignedHacks.length})
        </h2>
        {assignedHacks.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">No hacks assigned to this level yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add hacks using the selector above.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={assignedHacks.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {assignedHacks.map((hack) => (
                  <SortableHack key={hack.id} hack={hack} onRemove={handleRemoveHack} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {isUpdating && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Updating...
          </div>
        )}
      </div>
    </div>
  );
}
