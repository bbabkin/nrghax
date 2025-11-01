'use client';

import { useEffect, useState } from 'react';
import { ChecklistItem } from './ChecklistItem';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getHackChecks,
  getUserCheckProgress,
  getHackCheckProgress
} from '@/lib/hacks/supabase-actions';

interface ChecklistProps {
  hackId: string;
  isAuthenticated: boolean;
  onProgressChange?: (canComplete: boolean, progress: any) => void;
}

export function Checklist({ hackId, isAuthenticated, onProgressChange }: ChecklistProps) {
  const [checks, setChecks] = useState<any[]>([]);
  const [completedCheckIds, setCompletedCheckIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({
    total_checks: 0,
    completed_checks: 0,
    required_checks: 0,
    completed_required_checks: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChecksAndProgress();
  }, [hackId, isAuthenticated]);

  useEffect(() => {
    // Check if all required checks are completed
    const canComplete = progress.required_checks === progress.completed_required_checks;
    onProgressChange?.(canComplete, progress);
  }, [progress, onProgressChange]);

  const loadChecksAndProgress = async () => {
    setIsLoading(true);
    try {
      // Load checks
      const hacksData = await getHackChecks(hackId);
      setChecks(hacksData);

      if (isAuthenticated) {
        // Load user progress from database
        const progressData = await getUserCheckProgress(hackId);
        const completedIds = new Set(
          progressData
            .filter((p: any) => p.completed_at)
            .map((p: any) => p.hack_check_id)
        );
        setCompletedCheckIds(completedIds);

        // Get progress stats
        const stats = await getHackCheckProgress(hackId);
        setProgress(stats);
      } else {
        // Load from localStorage for anonymous users
        const storedProgress = getLocalCheckProgress(hackId);
        setCompletedCheckIds(storedProgress);

        // Calculate progress locally
        const stats = calculateLocalProgress(hacksData, storedProgress);
        setProgress(stats);
      }
    } catch (error) {
      console.error('Failed to load checks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (checkId: string, completed: boolean) => {
    // Update local state
    const newCompletedIds = new Set(completedCheckIds);
    if (completed) {
      newCompletedIds.add(checkId);
    } else {
      newCompletedIds.delete(checkId);
    }
    setCompletedCheckIds(newCompletedIds);

    // Save to localStorage for anonymous users
    if (!isAuthenticated) {
      saveLocalCheckProgress(hackId, newCompletedIds);
    }

    // Recalculate progress
    const stats = calculateLocalProgress(checks, newCompletedIds);
    setProgress(stats);
  };

  const calculateLocalProgress = (checksList: any[], completedIds: Set<string>) => {
    const total = checksList.length;
    const completed = checksList.filter(c => completedIds.has(c.id)).length;
    const required = checksList.filter(c => c.is_required).length;
    const completedRequired = checksList.filter(
      c => c.is_required && completedIds.has(c.id)
    ).length;

    return {
      total_checks: total,
      completed_checks: completed,
      required_checks: required,
      completed_required_checks: completedRequired
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (checks.length === 0) {
    return null;
  }

  const progressPercent = progress.total_checks > 0
    ? (progress.completed_checks / progress.total_checks) * 100
    : 0;

  const allRequiredComplete = progress.required_checks === progress.completed_required_checks;
  const hasOptionalIncomplete = progress.completed_checks < progress.total_checks;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Checklist</h3>
          <span className="text-sm text-muted-foreground">
            {progress.completed_checks} / {progress.total_checks} completed
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {!allRequiredComplete && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete all required checks before marking this hack as complete.
            ({progress.completed_required_checks} / {progress.required_checks} required checks done)
          </AlertDescription>
        </Alert>
      )}

      {allRequiredComplete && hasOptionalIncomplete && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            You can mark this hack as complete. Some optional checks remain.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {checks.map((check) => (
          <ChecklistItem
            key={check.id}
            check={check}
            isCompleted={completedCheckIds.has(check.id)}
            isAuthenticated={isAuthenticated}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}

// localStorage helpers for anonymous users
function getLocalCheckProgress(hackId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();

  const stored = localStorage.getItem(`hack_checks_${hackId}`);
  if (!stored) return new Set();

  try {
    const checkIds = JSON.parse(stored);
    return new Set(checkIds);
  } catch {
    return new Set();
  }
}

function saveLocalCheckProgress(hackId: string, completedIds: Set<string>) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    `hack_checks_${hackId}`,
    JSON.stringify(Array.from(completedIds))
  );
}