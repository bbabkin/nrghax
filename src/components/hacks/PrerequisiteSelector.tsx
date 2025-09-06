'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrerequisiteSelectorProps {
  availableHacks: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentHackId?: string; // To exclude current hack from selection
}

export function PrerequisiteSelector({
  availableHacks,
  selectedIds,
  onChange,
  currentHackId,
}: PrerequisiteSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  const handleAdd = (hackId: string) => {
    if (!selected.includes(hackId)) {
      const newSelected = [...selected, hackId];
      setSelected(newSelected);
      onChange(newSelected);
    }
  };

  const handleRemove = (hackId: string) => {
    const newSelected = selected.filter(id => id !== hackId);
    setSelected(newSelected);
    onChange(newSelected);
  };

  // Filter out current hack and already selected hacks
  const availableForSelection = availableHacks.filter(
    hack => hack.id !== currentHackId && !selected.includes(hack.id)
  );

  const selectedHacks = availableHacks.filter(hack => selected.includes(hack.id));

  return (
    <div className="space-y-3">
      <div>
        <Select onValueChange={handleAdd}>
          <SelectTrigger>
            <SelectValue placeholder="Select prerequisite hacks..." />
          </SelectTrigger>
          <SelectContent>
            {availableForSelection.length === 0 ? (
              <div className="px-2 py-1 text-sm text-gray-500">
                No available hacks to add
              </div>
            ) : (
              availableForSelection.map(hack => (
                <SelectItem key={hack.id} value={hack.id}>
                  {hack.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedHacks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedHacks.map(hack => (
            <Badge
              key={hack.id}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {hack.name}
              <button
                type="button"
                onClick={() => handleRemove(hack.id)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}