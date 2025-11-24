'use client';

import React, { useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Store
import { useCanvasStore } from '@/store/canvas-store';

// Hooks
import { useScrollManager, usePrefersReducedMotion } from '@/hooks/useScrollManager';
import { useKeyboardNavigation, useAriaAnnounce, useFocusTrap } from '@/hooks/useKeyboardNavigation';
import { useSwipeNavigation, useSwipeFeedback, usePinchZoom } from '@/hooks/useSwipeNavigation';
import { usePerformanceMonitor, useAnalytics } from '@/hooks/usePerformanceMonitor';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useScrollNavigation } from './useScrollNavigation';

// Components (lazy loaded for performance)
const VirtualSkillsTree = lazy(() => import('./VirtualSkillsTree').then(mod => ({ default: mod.VirtualSkillsTree })));
const LibraryView = lazy(() => import('../library/LibraryView'));
const LibrarySkillsNavCanvasSVG = lazy(() => import('../navigation/LibrarySkillsNavCanvasSVG').then(mod => ({ default: mod.LibrarySkillsNavCanvasSVG })));

// Animations
import {
  canvasTransitions,
  pageVariants,
  modalVariants,
  backdropVariants,
  getResponsiveAnimation,
  performanceConfig,
} from '@/lib/animations';

// Config
import {
  CANVAS_CONFIG,
  SCROLL_CONFIG,
  A11Y_CONFIG,
  VISUAL_CONFIG,
  ERROR_MESSAGES,
} from '@/config/canvas.config';

// Loading components
import {
  SkillTreeSkeleton,
  LibraryGridSkeleton,
  ProfileSkeleton,
} from '../ui/loading-skeletons';

// Types
import type { Tables } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';

interface UltimateCanvasProps {
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

/**
 * The Ultimate Canvas - Integrating all performance, accessibility, and UX improvements
 */
export default function UltimateCanvas({
  initialView,
  user,
  isAdmin,
  userProfile,
  levelsData,
  allHacks,
  routines,
  userCompletions,
  anonymousProgress,
  anonymousXP,
}: UltimateCanvasProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Store
  const {
    currentView,
    isAnimating,
    isLoading,
    preferences,
    setCurrentView,
    startViewTransition,
    completeViewTransition,
    setLoading,
    dismissOnboarding,
    updatePerformanceMetrics,
  } = useCanvasStore();

  // Refs
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const skillsRef = React.useRef<HTMLDivElement>(null);
  const libraryRef = React.useRef<HTMLDivElement>(null);

  // Performance & Analytics
  const { trackNavigation, trackInteraction, trackError } = useAnalytics();
  const { metrics, reportCustomMetric } = usePerformanceMonitor({
    enabled: true,
    sampleRate: 10, // Monitor 10% of users
    onPerformanceIssue: (issue, severity) => {
      trackError(issue, severity, { view: currentView });
    },
    onMetricsUpdate: (newMetrics) => {
      updatePerformanceMetrics(newMetrics);
    },
  });

  // Prefetching
  const { prefetch, prefetchData, prefetchImage } = usePrefetch({
    enabled: true,
    strategy: 'predictive',
  });

  // Accessibility
  const prefersReducedMotion = usePrefersReducedMotion();
  const { announce } = useAriaAnnounce();

  // Scroll Management
  const scrollManager = useScrollManager(canvasRef, {
    storageKey: `ultimate-canvas-${currentView}`,
    smooth: !prefersReducedMotion,
    offset: CANVAS_CONFIG.NAV_HEIGHT,
  });

  // Swipe Navigation
  const swipeHandlers = useSwipeNavigation({
    enabled: true,
    onSwipeUp: () => handleViewChange('library'),
    onSwipeDown: () => handleViewChange('skills'),
  });

  const { handlers: swipeFeedbackHandlers, swipeOffset, isSwipingState } = useSwipeFeedback();

  // Pinch Zoom
  const { scale, isPinching, resetScale } = usePinchZoom(canvasRef);

  // Scroll Navigation
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
    edgeTolerance: SCROLL_CONFIG.EDGE_TOLERANCE,
    edgeDwellTime: SCROLL_CONFIG.EDGE_DWELL_TIME,
    threshold: SCROLL_CONFIG.THRESHOLD_BASE,
  });

  // Keyboard Navigation
  useKeyboardNavigation({
    enabled: !isAnimating,
    onTab: (direction) => {
      if (direction === 'forward' && currentView === 'skills') {
        handleViewChange('library');
      } else if (direction === 'backward' && currentView === 'library') {
        handleViewChange('skills');
      }
    },
    onEscape: resetScale,
    onEnter: () => {
      trackInteraction('keyboard', 'enter', currentView);
    },
  });

  // View change handler
  const handleViewChange = useCallback(
    async (newView: 'skills' | 'library', method: 'click' | 'scroll' | 'swipe' | 'keyboard' = 'click') => {
      if (isAnimating || currentView === newView) return;

      // Track navigation
      trackNavigation(currentView, newView, method);

      // Start transition
      startViewTransition(newView);
      setLoading(true);

      // Save scroll position
      scrollManager.saveScrollPosition();

      // Announce for screen readers
      announce(`Navigating to ${newView} view`, 'polite');

      // Prefetch next likely navigation
      if (newView === 'skills') {
        prefetch(['/skills/foundation', '/skills/level-1']);
        prefetchData('/api/skills/progress', 'skillsProgress');
      } else {
        prefetch(['/library?filter=new', '/library?filter=completed']);
        prefetchData('/api/library/recommendations', 'recommendations');
      }

      // Update store and router
      setCurrentView(newView, !prefersReducedMotion);
      router.push(`/${newView}`, { scroll: false });

      // Complete transition
      setTimeout(() => {
        completeViewTransition();
        setLoading(false);
        scrollManager.restoreScrollPosition();
        reportCustomMetric('view_transition_time', Date.now());
      }, prefersReducedMotion ? 0 : 500);
    },
    [
      isAnimating,
      currentView,
      prefersReducedMotion,
      trackNavigation,
      startViewTransition,
      setLoading,
      scrollManager,
      announce,
      prefetch,
      prefetchData,
      setCurrentView,
      router,
      completeViewTransition,
      reportCustomMetric,
    ]
  );

  // Sync with URL
  useEffect(() => {
    const expectedView = pathname === '/skills' ? 'skills' : 'library';
    if (currentView !== expectedView && !isAnimating) {
      handleViewChange(expectedView, 'click');
    }
  }, [pathname, currentView, isAnimating, handleViewChange]);

  // Animation variants based on preferences
  const animationConfig = getResponsiveAnimation(prefersReducedMotion);

  // Error boundary fallback
  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-zinc-400 mb-6">{ERROR_MESSAGES.LOAD_FAILED}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
      >
        Reload Page
      </button>
    </div>
  );

  return (
    <div
      ref={canvasRef}
      className="relative w-full bg-zinc-950"
      style={{
        height: CANVAS_CONFIG.VIEWPORT_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
      }}
      role="main"
      aria-label={A11Y_CONFIG.ARIA_LABELS.CANVAS}
      {...swipeHandlers}
      {...swipeFeedbackHandlers}
    >
      {/* Skip Links */}
      <nav className="sr-only" aria-label="Skip navigation">
        {A11Y_CONFIG.SKIP_LINK_TARGETS.map((target) => (
          <a
            key={target}
            href={target}
            className="skip-link focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-500 focus:text-black focus:rounded"
          >
            Skip to {target.replace('#', '').replace('-', ' ')}
          </a>
        ))}
      </nav>

      {/* Performance Metrics Display (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>FPS: {metrics.fps}</div>
          <div>Render: {metrics.renderTime}ms</div>
          <div>Memory: {metrics.memoryUsage}MB</div>
        </div>
      )}

      {/* Onboarding */}
      <AnimatePresence>
        {preferences.hasSeenOnboarding === false && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-6 py-4 rounded-lg shadow-xl"
            role="tooltip"
            aria-label="Onboarding tip"
          >
            <p className="text-sm font-medium mb-2">
              Welcome to the Ultimate Canvas!
            </p>
            <ul className="text-xs space-y-1 mb-3">
              <li>• Scroll at edges to navigate between views</li>
              <li>• Swipe up/down on mobile</li>
              <li>• Use Tab key for keyboard navigation</li>
              <li>• Press Escape to reset zoom</li>
            </ul>
            <button
              onClick={dismissOnboarding}
              className="text-xs underline hover:no-underline"
              aria-label="Dismiss onboarding"
            >
              Got it, don&apos;t show again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <AnimatePresence>
        {isAtEdge && progress > SCROLL_CONFIG.PROGRESS_SHOW_THRESHOLD && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Scroll progress to switch view"
          >
            <div className="bg-zinc-800 rounded-full h-3 w-48 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-xs text-zinc-400 text-center mt-2">
              {currentView === 'skills' ? 'Scroll down for Library' : 'Scroll up for Skills'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 flex items-center justify-center z-50"
            >
              <div className="bg-zinc-900 rounded-lg p-8 text-center">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Loading...</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Canvas Container */}
      <motion.div
        className="relative h-full overflow-hidden"
        style={{
          ...performanceConfig.style,
          transform: `translateY(${swipeOffset.y}px)`,
        }}
        animate={{
          y: currentView === 'library' ? `calc(-100vh + ${CANVAS_CONFIG.NAV_HEIGHT}px)` : 0,
        }}
        transition={
          prefersReducedMotion ? canvasTransitions.instant : canvasTransitions.slide
        }
      >
        {/* Skills View */}
        <section
          ref={skillsRef}
          id="skills-content"
          className="absolute inset-x-0 top-0 h-screen overflow-y-auto overflow-x-hidden"
          aria-label={A11Y_CONFIG.ARIA_LABELS.SKILLS_TREE}
          aria-hidden={currentView !== 'skills'}
        >
          <Suspense fallback={<SkillTreeSkeleton />}>
            <VirtualSkillsTree
              levels={levelsData || []}
              userCompletions={userCompletions}
              isAuthenticated={!!user}
            />
          </Suspense>
        </section>

        {/* Navigation Bar */}
        <nav
          className="absolute inset-x-0"
          style={{ top: `calc(100vh - ${CANVAS_CONFIG.NAV_HEIGHT}px)` }}
          aria-label={A11Y_CONFIG.ARIA_LABELS.NAVIGATION}
        >
          <Suspense fallback={<div className="h-20 bg-zinc-900" />}>
            <LibrarySkillsNavCanvasSVG
              currentView={currentView}
              onTabClick={handleViewChange}
              fillProgress={progress}
              user={user}
              isAdmin={isAdmin}
              userProfile={userProfile}
              anonymousXP={anonymousXP}
            />
          </Suspense>
        </nav>

        {/* Library View */}
        <section
          ref={libraryRef}
          id="library-content"
          className="absolute inset-x-0 h-screen overflow-y-auto overflow-x-hidden"
          style={{ top: '100vh' }}
          aria-label={A11Y_CONFIG.ARIA_LABELS.LIBRARY_GRID}
          aria-hidden={currentView !== 'library'}
        >
          <Suspense fallback={<LibraryGridSkeleton />}>
            <LibraryView
              allHacks={allHacks}
              routines={routines}
              isAuthenticated={!!user}
              userCompletions={userCompletions}
              anonymousProgress={anonymousProgress}
              userId={user?.id}
            />
          </Suspense>
        </section>
      </motion.div>

      {/* Live Region for Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Current view: {currentView}. {isPinching ? 'Pinch zoom active' : ''} {isSwipingState ? 'Swiping' : ''}
      </div>
    </div>
  );
}