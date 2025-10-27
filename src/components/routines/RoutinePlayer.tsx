'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer, VideoPlayerRef } from '@/components/ui/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Menu,
  X,
  Play,
  Pause,
  SkipForward,
  Home,
  Trophy,
} from 'lucide-react';
import {
  updateRoutinePosition,
  markHackComplete,
  toggleAutoplay,
} from '@/lib/routines/player-actions';
import { cn } from '@/lib/utils';

interface Hack {
  id: string;
  name: string;
  slug?: string;
  description: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  contentType?: 'content' | 'link';
  contentBody?: string | null;
}

interface Routine {
  id: string;
  name: string;
  slug: string;
  description: string;
  hacks: Hack[];
  currentPosition?: number;
}

interface RoutinePlayerProps {
  routine: Routine;
  user: { id: string };
  autoplayEnabled?: boolean;
  onAutoplayChange?: (enabled: boolean) => void;
}

export function RoutinePlayer({
  routine,
  user,
  autoplayEnabled: initialAutoplay = true,
  onAutoplayChange,
}: RoutinePlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(routine.currentPosition || 0);
  const [completedHacks, setCompletedHacks] = useState<Set<string>>(new Set());
  const [autoplayEnabled, setAutoplayEnabled] = useState(initialAutoplay);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoNavigationRef = useRef(false);

  const currentHack = routine.hacks[currentIndex];
  const totalHacks = routine.hacks.length;
  const progress = Math.floor(((completedHacks.size) / totalHacks) * 100);
  const isLastHack = currentIndex === totalHacks - 1;
  const isFirstHack = currentIndex === 0;

  // Load completed hacks on mount
  useEffect(() => {
    const loadProgress = async () => {
      // This would normally come from the server action
      // For now, we'll initialize from the routine data
      const completed = new Set<string>();
      routine.hacks.slice(0, routine.currentPosition || 0).forEach(hack => {
        completed.add(hack.id);
      });
      setCompletedHacks(completed);
    };
    loadProgress();
  }, [routine]);

  // Save position to database
  const savePosition = useCallback(async (position: number) => {
    const result = await updateRoutinePosition(routine.id, position, totalHacks);
    if (!result.success) {
      console.error('Failed to save position:', result.error);
    }
  }, [routine.id, totalHacks]);

  // Handle hack completion
  const completeCurrentHack = useCallback(async () => {
    if (!currentHack) return;

    const newCompleted = new Set(completedHacks);
    newCompleted.add(currentHack.id);
    setCompletedHacks(newCompleted);

    await markHackComplete(currentHack.id, routine.id);
  }, [currentHack, completedHacks, routine.id]);

  // Navigate to next hack
  const goToNext = useCallback(async (isAutoNav = false) => {
    if (isLastHack) {
      setIsCompleted(true);
      await completeCurrentHack();
      return;
    }

    await completeCurrentHack();
    const nextIndex = currentIndex + 1;

    // Clear any existing timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);

    // Track whether this is auto-navigation
    isAutoNavigationRef.current = isAutoNav;

    setCurrentIndex(nextIndex);
    await savePosition(nextIndex);
    setError(null);
  }, [isLastHack, currentIndex, completeCurrentHack, savePosition]);

  // Navigate to previous hack
  const goToPrevious = useCallback(async () => {
    if (isFirstHack) return;

    // Clear any existing timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);

    // Manual navigation
    isAutoNavigationRef.current = false;

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    await savePosition(prevIndex);
    setError(null);
  }, [isFirstHack, currentIndex, savePosition]);

  // Jump to specific hack
  const goToHack = useCallback(async (index: number) => {
    if (index < 0 || index >= totalHacks) return;

    // Clear any existing timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);

    // Manual navigation
    isAutoNavigationRef.current = false;

    setCurrentIndex(index);
    await savePosition(index);
    setIsSidebarOpen(false);
    setError(null);
  }, [totalHacks, savePosition]);

  // Handle video end
  const handleVideoEnd = useCallback(async () => {
    console.log('Video ended - handleVideoEnd called', {
      autoplayEnabled,
      isLastHack,
      mediaType: currentHack?.mediaType,
      hackName: currentHack?.name,
      currentHackId: currentHack?.id
    });

    if (!currentHack) {
      console.error('No current hack found in handleVideoEnd');
      return;
    }

    // If this is the last hack, mark routine as fully completed
    if (isLastHack) {
      console.log('Last hack - marking as complete before showing completion screen');

      // Mark the last hack as complete in the database
      console.log('Calling markHackComplete for last hack:', currentHack.id);
      await markHackComplete(currentHack.id, routine.id);

      // Update completed hacks state to include this last one
      const allCompleted = new Set(completedHacks);
      allCompleted.add(currentHack.id);
      setCompletedHacks(allCompleted);

      console.log('Saving routine progress with all hacks completed:', Array.from(allCompleted).length, 'of', totalHacks);

      // Save final progress as 100% completed
      const { saveRoutineProgress } = await import('@/lib/routines/player-actions');
      const result = await saveRoutineProgress({
        routineId: routine.id,
        currentPosition: currentIndex,
        totalHacks: totalHacks,
        completedHacks: Array.from(allCompleted),
      });

      console.log('Progress save result:', result);

      setTimeout(() => {
        setIsCompleted(true);
      }, 500);
      return;
    }

    // For non-last hacks, mark as complete
    console.log('Marking hack as complete:', currentHack.id);
    await completeCurrentHack();

    // Check if should auto-advance to next hack
    const shouldAutoAdvance =
      autoplayEnabled &&
      (currentHack?.mediaType === 'youtube' || currentHack?.mediaType === 'video');

    console.log('Should auto-advance?', shouldAutoAdvance);

    if (shouldAutoAdvance) {
      // Small delay for smooth transition
      console.log('Auto-advancing to next hack in 500ms...');
      setTimeout(() => {
        goToNext(true); // true = auto-navigation
      }, 500);
    }
  }, [autoplayEnabled, isLastHack, currentHack, goToNext, completeCurrentHack, completedHacks, currentIndex, routine.id, totalHacks]);

  // Handle video error
  const handleVideoError = useCallback((err: { type: string; message?: string }) => {
    console.error('Video error:', err);
    setError(`Error loading video: ${err.message || 'Unknown error'}`);
  }, []);

  // Toggle autoplay
  const handleAutoplayToggle = useCallback(async (checked: boolean) => {
    setAutoplayEnabled(checked);
    onAutoplayChange?.(checked);
    await toggleAutoplay(routine.id, checked);
  }, [routine.id, onAutoplayChange]);

  // Cancel autoplay countdown
  const cancelAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  // 3-second delayed autoplay for videos with countdown (only on auto-navigation)
  useEffect(() => {
    // Clear any existing timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);

    // Only autoplay if enabled and current hack has a video
    if (autoplayEnabled && currentHack?.mediaUrl && currentHack?.mediaType) {
      const isAutoNav = isAutoNavigationRef.current;
      console.log('Autoplay check - isAutoNav:', isAutoNav, 'hack:', currentHack.name);

      if (isAutoNav) {
        // Auto-navigation: Show countdown and autoplay
        console.log('Auto-navigation: Starting 3-second countdown');
        setCountdown(3);

        // Countdown timer (ticks every second)
        let currentCount = 3;
        countdownIntervalRef.current = setInterval(() => {
          currentCount -= 1;
          console.log('Countdown:', currentCount);
          setCountdown(currentCount);

          if (currentCount <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
          }
        }, 1000);

        // Autoplay timer (fires after 3 seconds)
        autoplayTimerRef.current = setTimeout(() => {
          console.log('Autoplay timer fired, playing video');
          videoPlayerRef.current?.play();
          setCountdown(null);
        }, 3000);
      } else {
        // Manual navigation: Leave video paused (no action needed)
        console.log('Manual navigation: Video will remain paused');
      }
    } else {
      console.log('No autoplay - autoplayEnabled:', autoplayEnabled, 'mediaUrl:', currentHack?.mediaUrl, 'mediaType:', currentHack?.mediaType);
    }

    // Cleanup on unmount or when hack changes
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdown(null);
    };
  }, [currentIndex, currentHack?.id, autoplayEnabled, currentHack?.mediaUrl, currentHack?.mediaType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Escape':
          e.preventDefault();
          // Cancel autoplay countdown if active
          if (countdown !== null && countdown > 0) {
            cancelAutoplay();
          } else {
            router.push(`/routines/${routine.slug}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, routine.slug, router, countdown, cancelAutoplay]);

  // Completion screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center">
          <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Routine Completed! 🎉</h1>
          <p className="text-xl text-gray-400 dark:text-gray-500 mb-8">
            Congratulations! You&apos;ve completed all {totalHacks} hacks in &quot;{routine.name}&quot;
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/hacks')}>
              <Home className="h-4 w-4 mr-2" />
              Back to Hacks
            </Button>
            <Button variant="outline" onClick={() => { setCurrentIndex(0); setIsCompleted(false); setCompletedHacks(new Set()); }}>
              Restart Routine
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/routines/${routine.slug}`)}
              >
                <X className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{routine.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {currentIndex + 1} of {totalHacks}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Autoplay toggle */}
              <div className="hidden sm:flex items-center gap-2">
                <Switch
                  id="autoplay"
                  checked={autoplayEnabled}
                  onCheckedChange={handleAutoplayToggle}
                  data-testid="autoplay-toggle"
                />
                <Label htmlFor="autoplay" className="text-sm">
                  Autoplay
                </Label>
              </div>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={progress}>
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{progress}% complete</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="md:col-span-2">
            <Card className="p-6">
              {/* Hack title */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">{currentHack?.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{currentHack?.description}</p>
              </div>

              {/* Video player or content */}
              {currentHack?.mediaType && currentHack?.mediaUrl ? (
                <div className="mb-6">
                  {/* Countdown indicator */}
                  {countdown !== null && countdown > 0 && (
                    <div className="mb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 shadow-lg animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
                            <div className="relative flex items-center justify-center w-12 h-12 bg-white text-blue-600 rounded-full font-bold text-xl shadow-md">
                              {countdown}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Video starting soon</p>
                            <p className="text-sm opacity-90">{countdown} second{countdown !== 1 ? 's' : ''} remaining</p>
                          </div>
                        </div>
                        <Button
                          size="default"
                          variant="secondary"
                          onClick={cancelAutoplay}
                          className="bg-white/10 backdrop-blur text-white border-white/20 hover:bg-white/20"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      </div>
                    </div>
                  )}

                  {error ? (
                    <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white p-6 text-center">
                      <p className="font-semibold mb-4">Error loading video</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{error}</p>
                      <Button onClick={() => goToNext()} variant="secondary">
                        <SkipForward className="h-4 w-4 mr-2" />
                        Skip
                      </Button>
                    </div>
                  ) : (
                    <VideoPlayer
                      ref={videoPlayerRef}
                      type={currentHack.mediaType}
                      url={currentHack.mediaUrl}
                      autoplay={false}
                      onEnded={handleVideoEnd}
                      onError={handleVideoError}
                      title={currentHack.name}
                    />
                  )}
                </div>
              ) : null}

              {/* Text content */}
              {currentHack?.contentType === 'content' && currentHack?.contentBody && (
                <div
                  className="prose prose-lg max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: currentHack.contentBody }}
                />
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                  disabled={isFirstHack}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={() => goToNext()} className="flex-1">
                  {isLastHack ? (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar with hack list */}
          <div
            className={cn(
              "md:block",
              isSidebarOpen ? "block" : "hidden"
            )}
            data-testid="hack-sidebar"
          >
            <Card className="p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Hacks</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {routine.hacks.map((hack, index) => {
                  const isCurrentHack = index === currentIndex;
                  const isCompleted = completedHacks.has(hack.id);

                  return (
                    <button
                      key={hack.id}
                      onClick={() => goToHack(index)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        isCurrentHack && "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 current",
                        isCompleted && "completed"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-1">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {index + 1}. {hack.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                            {hack.description}
                          </p>
                          {hack.mediaType && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {hack.mediaType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
