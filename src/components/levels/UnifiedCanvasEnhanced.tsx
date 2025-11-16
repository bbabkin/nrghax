'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Hooks
import { useScrollManager, usePrefersReducedMotion, useScrollRestoration } from '@/hooks/useScrollManager';
import { useKeyboardNavigation, useAriaAnnounce } from '@/hooks/useKeyboardNavigation';
import { useScrollNavigation } from './useScrollNavigation';

// Components
import { CustomSkillsTree } from './CustomSkillsTree';
import LibraryView from '../library/LibraryView';
import { LibrarySkillsNavCanvasSVG } from '../navigation/LibrarySkillsNavCanvasSVG';

// Types
import type { Tables } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';

interface UnifiedCanvasEnhancedProps {
  initialView: 'skills' | 'library';
  user: User | null;
  isAdmin: boolean;
  userProfile?: any;
  levelsData?: any[];
  allHacks?: Tables<'hacks'>[];
  routines?: any[];
  userCompletions?: any;
  anonymousProgress?: any;
  anonymousXP?: number;
}

// Constants
const VIEWPORT_HEIGHT = '200vh';
const NAV_HEIGHT = 80;
const EDGE_TOLERANCE = 20;
const EDGE_DWELL_TIME = 200;
const SCROLL_THRESHOLD_BASE = 400;

export default function UnifiedCanvasEnhanced({
  initialView,
  user,
  isAdmin,
  userProfile,
  levelsData,
  allHacks,
  routines,
  userCompletions,
  anonymousProgress,
  anonymousXP
}: UnifiedCanvasEnhancedProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);

  // State
  const [currentView, setCurrentView] = useState<'skills' | 'library'>(initialView);
  const [visualView, setVisualView] = useState<'skills' | 'library'>(initialView);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canvas-onboarding-dismissed') === 'true';
    }
    return true;
  });

  // Hooks
  const prefersReducedMotion = usePrefersReducedMotion();
  const { announce } = useAriaAnnounce();
  const scrollManager = useScrollManager(canvasRef, {
    storageKey: `canvas-${currentView}`,
    smooth: !prefersReducedMotion,
    offset: NAV_HEIGHT
  });

  // Scroll restoration for each view
  const skillsScrollManager = useScrollRestoration(skillsRef, 'skills');
  const libraryScrollManager = useScrollRestoration(libraryRef, 'library');

  // Memoized data transformations
  const processedHacks = useMemo(() => {
    if (!allHacks) return [];
    // Add any processing logic here
    return allHacks;
  }, [allHacks]);

  const processedRoutines = useMemo(() => {
    if (!routines) return [];
    // Add any sorting/filtering logic here
    return routines.sort((a, b) => {
      const dateA = new Date(b.created_at).getTime();
      const dateB = new Date(a.created_at).getTime();
      return dateA - dateB;
    });
  }, [routines]);

  // Handle view change with animation
  const handleViewChange = useCallback((newView: 'skills' | 'library', animate = true) => {
    if (isAnimating || currentView === newView) return;

    setIsAnimating(true);
    setShouldAnimate(animate && !prefersReducedMotion);
    setIsLoading(true);

    // Save current scroll position
    if (currentView === 'skills') {
      skillsScrollManager.saveScrollPosition();
    } else {
      libraryScrollManager.saveScrollPosition();
    }

    // Announce view change for screen readers
    announce(`Switched to ${newView} view`, 'polite');

    // Update state
    setCurrentView(newView);
    setVisualView(newView);

    // Update URL
    const newPath = newView === 'skills' ? '/skills' : '/library';
    router.push(newPath, { scroll: false });

    // Restore scroll position after animation
    setTimeout(() => {
      if (newView === 'skills') {
        skillsScrollManager.restoreScrollPosition();
      } else {
        libraryScrollManager.restoreScrollPosition();
      }
      setIsAnimating(false);
      setIsLoading(false);
    }, prefersReducedMotion ? 0 : 500);
  }, [
    isAnimating,
    currentView,
    prefersReducedMotion,
    router,
    announce,
    skillsScrollManager,
    libraryScrollManager
  ]);

  // Scroll-based navigation
  const { progress, isAtEdge } = useScrollNavigation({
    canvasRef,
    currentView,
    onNavigate: (direction) => {
      if (direction === 'down' && currentView === 'skills') {
        handleViewChange('library');
      } else if (direction === 'up' && currentView === 'library') {
        handleViewChange('skills');
      }
    },
    edgeTolerance: EDGE_TOLERANCE,
    edgeDwellTime: EDGE_DWELL_TIME,
    threshold: SCROLL_THRESHOLD_BASE
  });

  // Keyboard navigation
  useKeyboardNavigation({
    enabled: !isAnimating,
    onTab: (direction) => {
      if (direction === 'forward' && currentView === 'skills') {
        handleViewChange('library');
      } else if (direction === 'backward' && currentView === 'library') {
        handleViewChange('skills');
      }
    },
    onEscape: () => {
      // Could be used to close modals or reset view
    }
  });

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    const expectedView = pathname === '/skills' ? 'skills' : 'library';
    if (currentView !== expectedView && !isAnimating) {
      handleViewChange(expectedView, false);
    }
  }, [pathname, currentView, isAnimating, handleViewChange]);

  // Animation variants
  const canvasVariants = {
    skills: { y: 0 },
    library: { y: `calc(-100vh + ${NAV_HEIGHT}px)` }
  };

  const springTransition = {
    type: 'spring',
    damping: 30,
    stiffness: 200,
    mass: 0.8
  };

  const instantTransition = {
    duration: 0
  };

  // Onboarding tooltip
  const renderOnboarding = () => {
    if (onboardingDismissed) return null;

    return (
      <div
        className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg"
        role="tooltip"
      >
        <p className="text-sm font-medium">
          💡 Tip: Scroll to the edge of each view to navigate between Skills and Library!
        </p>
        <button
          onClick={() => {
            setOnboardingDismissed(true);
            localStorage.setItem('canvas-onboarding-dismissed', 'true');
          }}
          className="ml-4 underline text-xs"
        >
          Got it!
        </button>
      </div>
    );
  };

  // Progress indicator
  const renderProgressIndicator = () => {
    if (!isAtEdge || progress <= 10) return null;

    return (
      <div
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Scroll progress to switch view"
      >
        <div className="bg-zinc-800 rounded-full h-2 w-48 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-400 text-center mt-1">
          {currentView === 'skills' ? 'Scroll down for Library' : 'Scroll up for Skills'}
        </p>
      </div>
    );
  };

  return (
    <div
      className="relative w-full bg-zinc-950"
      style={{ height: VIEWPORT_HEIGHT }}
      role="main"
      aria-label="Skills and Library Canvas"
    >
      {/* Skip Links for Accessibility */}
      <div className="sr-only">
        <a href="#skills-content" className="skip-link">Skip to Skills</a>
        <a href="#library-content" className="skip-link">Skip to Library</a>
      </div>

      {/* Onboarding */}
      {renderOnboarding()}

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Loading Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas */}
      <motion.div
        ref={canvasRef}
        className="relative h-full overflow-hidden"
        animate={prefersReducedMotion ? {} : canvasVariants[currentView]}
        transition={
          shouldAnimate && !prefersReducedMotion
            ? springTransition
            : instantTransition
        }
      >
        {/* Skills View */}
        <section
          ref={skillsRef}
          id="skills-content"
          className="absolute inset-x-0 top-0 h-screen overflow-y-auto overflow-x-hidden"
          aria-label="Skills Tree"
          aria-hidden={currentView !== 'skills'}
        >
          <div className="min-h-full pb-20">
            {levelsData && (
              <CustomSkillsTree
                levelsData={levelsData}
                allHacks={processedHacks}
                userCompletions={userCompletions}
                anonymousProgress={anonymousProgress}
                userProfile={userProfile}
                isAuthenticated={!!user}
              />
            )}
          </div>
        </section>

        {/* Navigation Bar */}
        <nav
          className="absolute inset-x-0"
          style={{ top: 'calc(100vh - 80px)' }}
          aria-label="View Navigation"
        >
          <LibrarySkillsNavCanvasSVG
            currentView={visualView}
            onTabClick={handleViewChange}
            fillProgress={progress}
            user={user}
            isAdmin={isAdmin}
            userProfile={userProfile}
            anonymousXP={anonymousXP}
          />
        </nav>

        {/* Library View */}
        <section
          ref={libraryRef}
          id="library-content"
          className="absolute inset-x-0 h-screen overflow-y-auto overflow-x-hidden"
          style={{ top: '100vh' }}
          aria-label="Hack Library"
          aria-hidden={currentView !== 'library'}
        >
          <div className="min-h-full pt-20 pb-20">
            <LibraryView
              allHacks={processedHacks}
              routines={processedRoutines}
              isAuthenticated={!!user}
              userCompletions={userCompletions}
              anonymousProgress={anonymousProgress}
              userId={user?.id}
            />
          </div>
        </section>
      </motion.div>

      {/* Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Current view: {currentView}
      </div>
    </div>
  );
}