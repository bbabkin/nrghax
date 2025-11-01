'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { toggleCheckItem } from '@/lib/hacks/supabase-actions';

interface ChecklistItemProps {
  check: {
    id: string;
    title: string;
    description?: string | null;
    is_required: boolean;
  };
  isCompleted: boolean;
  isAuthenticated: boolean;
  onToggle?: (checkId: string, completed: boolean) => void;
}

export function ChecklistItem({ check, isCompleted, isAuthenticated, onToggle }: ChecklistItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(isCompleted);

  const handleToggle = async () => {
    if (isLoading) return;

    const newValue = !localCompleted;
    setLocalCompleted(newValue);
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        // Update in database for authenticated users
        await toggleCheckItem(check.id, newValue);
      }

      // Call the parent's onToggle callback for local state management
      onToggle?.(check.id, newValue);
    } catch (error) {
      // Revert on error
      setLocalCompleted(!newValue);
      console.error('Failed to toggle check item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="pt-0.5">
        <Checkbox
          id={check.id}
          checked={localCompleted}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="mt-0.5"
        />
      </div>

      <div className="flex-1 space-y-1">
        <label
          htmlFor={check.id}
          className={`text-sm font-medium cursor-pointer select-none ${
            localCompleted ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {check.title}
        </label>

        {check.description && (
          <div
            className={`text-xs text-muted-foreground ${
              localCompleted ? 'opacity-60' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: check.description }}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {check.is_required ? (
          <Badge variant="destructive" className="text-xs">
            Required
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Optional
          </Badge>
        )}

        {localCompleted && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>
    </div>
  );
}