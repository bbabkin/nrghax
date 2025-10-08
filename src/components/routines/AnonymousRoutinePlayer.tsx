'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoPlayer, VideoPlayerRef } from '@/components/ui/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocalRoutineProgress } from '@/hooks/useLocalRoutineProgress';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Menu,
  X,
  Home,
  Trophy,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Hack {
  id: string;
  name: string;
  slug?: string;
  description: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  contentType?: 'content' | 'link';
  contentBody?: string | null;
  externalLink?: string | null;
  difficulty?: string;
  timeMinutes?: number;
  category?: string;
}

interface Routine {
  id: string;
  name: string;
  slug: string;
  description: string;
  hacks: Hack[];
}

interface AnonymousRoutinePlayerProps {
  routine: Routine;
}

export function AnonymousRoutinePlayer({ routine }: AnonymousRoutinePlayerProps) {
  const {
    progress: savedProgress,
    isLoading,
    updatePosition,
    markHackComplete,
    toggleAutoplay: saveAutoplay,
  } = useLocalRoutineProgress(routine.id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedHacks, setCompletedHacks] = useState<Set<string>>(new Set());
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoNavigationRef = useRef(false);

  const currentHack = routine.hacks[currentIndex];
  const totalHacks = routine.hacks.length;
  const progress = Math.floor((completedHacks.size / totalHacks) * 100);
  const isLastHack = currentIndex === totalHacks - 1;
  const isFirstHack = currentIndex === 0;

  // Load saved progress when component mounts
  useEffect(() => {
    if (!isLoading && savedProgress) {
      setCurrentIndex(savedProgress.currentPosition || 0);
      setCompletedHacks(new Set(savedProgress.completedHacks || []));
      setAutoplayEnabled(savedProgress.autoplayEnabled ?? true);
    }
  }, [isLoading, savedProgress]);

  // Save position to localStorage
  const savePosition = useCallback(
    (position: number) => {
      const success = updatePosition(position, totalHacks);
      if (!success) {
        console.error('Failed to save position to localStorage');
      }
    },
    [updatePosition, totalHacks]
  );

  // Handle navigation
  const goToHack = useCallback(
    (index: number, isAutoNav = false) => {
      if (index >= 0 && index < totalHacks) {
        // Clear any existing timers and countdown
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

        setCurrentIndex(index);
        savePosition(index);
      }
    },
    [totalHacks, savePosition]
  );

  const goNext = useCallback(() => {
    if (currentIndex < totalHacks - 1) {
      goToHack(currentIndex + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, totalHacks, goToHack]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      goToHack(currentIndex - 1);
    }
  }, [currentIndex, goToHack]);

  // Mark current hack as complete
  const handleMarkComplete = useCallback(async () => {
    if (!completedHacks.has(currentHack.id)) {
      const newCompleted = new Set(completedHacks);
      newCompleted.add(currentHack.id);
      setCompletedHacks(newCompleted);

      // Save to localStorage
      const success = markHackComplete(currentHack.id);
      if (!success) {
        console.error('Failed to save completion to localStorage');
      }

      // Auto-advance if enabled
      if (autoplayEnabled && !isLastHack) {
        setTimeout(goNext, 1500);
      }
    }
  }, [currentHack?.id, completedHacks, autoplayEnabled, isLastHack, goNext, markHackComplete]);

  // Handle autoplay toggle
  const handleAutoplayToggle = useCallback(
    (enabled: boolean) => {
      setAutoplayEnabled(enabled);
      saveAutoplay(enabled);
    },
    [saveAutoplay]
  );

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    if (!completedHacks.has(currentHack.id)) {
      handleMarkComplete();
    }

    // Auto-navigate to next hack after video ends
    if (autoplayEnabled && !isLastHack) {
      setTimeout(() => {
        goToHack(currentIndex + 1, true); // true = auto-navigation
      }, 100);
    }
  }, [currentHack?.id, completedHacks, autoplayEnabled, isLastHack, currentIndex, handleMarkComplete, goToHack]);

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

  // 5-second delayed autoplay for videos with countdown (only on auto-navigation)
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
        console.log('Auto-navigation: Starting 5-second countdown');
        setCountdown(5);

        // Countdown timer (ticks every second)
        let currentCount = 5;
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

        // Autoplay timer (fires after 5 seconds)
        autoplayTimerRef.current = setTimeout(() => {
          console.log('Autoplay timer fired, playing video');
          videoPlayerRef.current?.play();
          setCountdown(null);
        }, 5000);
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
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'j':
          goPrevious();
          break;
        case 'ArrowRight':
        case 'l':
          goNext();
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          if (currentHack?.mediaUrl && videoPlayerRef.current) {
            // Toggle play/pause on the actual video player
            videoPlayerRef.current.pause(); // This will toggle between play/pause
          }
          break;
        case 'Escape':
          // Cancel autoplay countdown if active
          if (countdown !== null && countdown > 0) {
            cancelAutoplay();
          }
          break;
        case 'c':
          handleMarkComplete();
          break;
        case 'm':
          setIsSidebarOpen(!isSidebarOpen);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goPrevious, goNext, currentHack, handleMarkComplete, isSidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading routine...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Routine Completed!</h2>
          <p className="text-muted-foreground mb-6">
            Great job! You&apos;ve completed all {totalHacks} hacks in this routine.
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold">Create a Free Account</h3>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-4">
              ✨ Always free. No credit card required.
            </p>
            <ul className="space-y-2 text-sm text-foreground text-left mb-4">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Save progress across all devices</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Track your completed routines</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Get personalized recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Create your own custom routines</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href={`/auth?redirect=/routines/${routine.slug}/play`}>
              <Button className="w-full" variant="default" size="lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up Free - Forever
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsCompleted(false);
                goToHack(0);
              }}
            >
              Start Over
            </Button>
            <Link href={`/routines/${routine.slug}`}>
              <Button variant="ghost" className="w-full">
                Back to Routine
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gray-800 transform transition-transform lg:transform-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-semibold truncate">{routine.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-300">
              Progress: {completedHacks.size} of {totalHacks} completed
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Hack list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {routine.hacks.map((hack, index) => (
              <button
                key={hack.id}
                onClick={() => goToHack(index)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  index === currentIndex
                    ? 'bg-purple-600'
                    : 'hover:bg-gray-700',
                  completedHacks.has(hack.id) && 'border-l-4 border-green-500'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {completedHacks.has(hack.id) && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {index + 1}. {hack.name}
                      </span>
                    </div>
                    {hack.timeMinutes && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-6">
                        {hack.timeMinutes} min
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 space-y-3">
            <Alert className="bg-purple-900 border-purple-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-gray-300">
                Progress saved locally. Sign up to sync across devices!
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between pb-3">
              <Label htmlFor="autoplay" className="text-sm">
                Autoplay
              </Label>
              <Switch
                id="autoplay"
                checked={autoplayEnabled}
                onCheckedChange={handleAutoplayToggle}
              />
            </div>

            <Link href="/" className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center">
            <h2 className="text-xl font-semibold">{currentHack?.name}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Hack {currentIndex + 1} of {totalHacks}
            </p>
          </div>

          <div className="flex gap-2">
            {currentHack?.difficulty && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {currentHack.difficulty}
              </Badge>
            )}
            {currentHack?.category && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {currentHack.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className={cn(
            "w-full max-w-5xl mx-auto",
            currentHack?.mediaUrl
              ? "h-full flex items-start lg:items-center p-4 sm:p-6 md:p-8 lg:py-12"
              : "p-4 sm:p-6 md:p-8 pt-8"
          )}>
            <div className="w-full">
            {/* Description */}
            {currentHack?.description && (
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                {currentHack.description}
              </p>
            )}

            {/* Media content */}
            {currentHack?.mediaUrl && currentHack?.mediaType && (
              <div className="mb-6">
                {/* Countdown indicator */}
                {countdown !== null && countdown > 0 && (
                  <div className="mb-3 bg-purple-600 text-white rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-white text-purple-600 rounded-full font-bold text-lg">
                        {countdown}
                      </div>
                      <span className="text-sm">Video starting in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={cancelAutoplay}
                      className="bg-white text-purple-600 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  </div>
                )}

                <VideoPlayer
                  ref={videoPlayerRef}
                  type={currentHack.mediaType}
                  url={currentHack.mediaUrl}
                  autoplay={false}
                  onEnded={handleVideoEnd}
                  title={currentHack.name}
                />
              </div>
            )}

            {/* Text content */}
            {currentHack?.contentBody && (
              <div className="prose prose-invert prose-lg max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: currentHack.contentBody }}
                />
              </div>
            )}

            {/* External link */}
            {currentHack?.contentType === 'link' && currentHack?.externalLink && (
              <div className="mt-6">
                <a
                  href={currentHack.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  View External Resource →
                </a>
              </div>
            )}

            {/* Navigation and action buttons */}
            <div className="mt-8 pt-6 border-t border-gray-700 space-y-6">
              {/* Mark Complete button - primary action */}
              <div className="flex items-center justify-center">
                <Button
                  variant={completedHacks.has(currentHack?.id) ? 'secondary' : 'default'}
                  onClick={handleMarkComplete}
                  size="lg"
                  className="min-w-[240px] h-12 text-base"
                >
                  {completedHacks.has(currentHack?.id) ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-6">
                <Button
                  variant="outline"
                  onClick={goPrevious}
                  disabled={isFirstHack}
                  size="lg"
                  className="flex-1 sm:flex-none sm:min-w-[160px] h-12"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>

                <div className="text-center px-4">
                  <div className="text-base font-medium text-gray-300">
                    {currentIndex + 1} / {totalHacks}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={goNext}
                  disabled={isLastHack && !completedHacks.has(currentHack?.id)}
                  size="lg"
                  className="flex-1 sm:flex-none sm:min-w-[160px] h-12"
                >
                  {isLastHack ? 'Finish' : 'Next'}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Bottom bar - keyboard shortcuts */}
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="text-center text-xs text-gray-500 dark:text-gray-300 dark:text-gray-500">
            Keyboard: ← → Navigate | Space Play/Pause | C Complete | M Menu
          </div>
        </div>
      </div>
    </div>
  );
}