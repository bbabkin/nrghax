import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useEffect } from 'react';

// Types
export type CanvasView = 'skills' | 'library';
export type ScrollDirection = 'up' | 'down' | 'none';
export type DeviceType = 'mouse' | 'trackpad' | 'touch';

interface ScrollState {
  position: { x: number; y: number };
  isScrolling: boolean;
  direction: ScrollDirection;
  velocity: number;
  lastScrollTime: number;
}

interface NavigationState {
  currentView: CanvasView;
  previousView: CanvasView | null;
  isAnimating: boolean;
  transitionProgress: number;
  isAtEdge: boolean;
  edgeDwellTime: number;
}

interface UserPreferences {
  prefersReducedMotion: boolean;
  hasSeenOnboarding: boolean;
  preferredView: CanvasView;
  deviceType: DeviceType;
}

interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  scrollPerformance: number;
  lastMeasurement: number;
}

interface CanvasState {
  // Navigation
  navigation: NavigationState;

  // Scroll
  scroll: ScrollState;

  // User preferences
  preferences: UserPreferences;

  // Performance
  performance: PerformanceMetrics;

  // UI State
  ui: {
    isLoading: boolean;
    showProgressIndicator: boolean;
    showOnboarding: boolean;
    searchQuery: string;
    selectedFilters: string[];
    expandedSections: string[];
  };

  // Data cache
  cache: {
    lastFetch: number;
    cachedHacks: any[];
    cachedRoutines: any[];
    cachedLevels: any[];
  };
}

interface CanvasActions {
  // Navigation actions
  setCurrentView: (view: CanvasView, animate?: boolean) => void;
  startViewTransition: (to: CanvasView) => void;
  completeViewTransition: () => void;
  setTransitionProgress: (progress: number) => void;

  // Scroll actions
  updateScrollPosition: (position: { x: number; y: number }) => void;
  setScrollDirection: (direction: ScrollDirection) => void;
  setScrollVelocity: (velocity: number) => void;
  setIsScrolling: (isScrolling: boolean) => void;

  // Edge detection
  setIsAtEdge: (isAtEdge: boolean) => void;
  updateEdgeDwellTime: (time: number) => void;
  resetEdgeDwell: () => void;

  // Preferences
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  dismissOnboarding: () => void;
  setDeviceType: (deviceType: DeviceType) => void;

  // UI actions
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (filter: string) => void;
  toggleSection: (sectionId: string) => void;

  // Cache actions
  setCachedData: (type: 'hacks' | 'routines' | 'levels', data: any[]) => void;
  invalidateCache: () => void;

  // Performance
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;

  // Utility
  reset: () => void;
}

// Initial state
const initialState: CanvasState = {
  navigation: {
    currentView: 'skills',
    previousView: null,
    isAnimating: false,
    transitionProgress: 0,
    isAtEdge: false,
    edgeDwellTime: 0,
  },
  scroll: {
    position: { x: 0, y: 0 },
    isScrolling: false,
    direction: 'none',
    velocity: 0,
    lastScrollTime: 0,
  },
  preferences: {
    prefersReducedMotion: false,
    hasSeenOnboarding: false,
    preferredView: 'skills',
    deviceType: 'trackpad',
  },
  performance: {
    frameRate: 60,
    renderTime: 0,
    scrollPerformance: 100,
    lastMeasurement: Date.now(),
  },
  ui: {
    isLoading: false,
    showProgressIndicator: false,
    showOnboarding: true,
    searchQuery: '',
    selectedFilters: [],
    expandedSections: [],
  },
  cache: {
    lastFetch: 0,
    cachedHacks: [],
    cachedRoutines: [],
    cachedLevels: [],
  },
};

// Create the store
export const useCanvasStore = create<CanvasState & CanvasActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Navigation actions
          setCurrentView: (view, animate = true) =>
            set((state) => {
              state.navigation.previousView = state.navigation.currentView;
              state.navigation.currentView = view;
              state.navigation.isAnimating = animate;
              state.preferences.preferredView = view;
            }),

          startViewTransition: (to) =>
            set((state) => {
              state.navigation.isAnimating = true;
              state.navigation.transitionProgress = 0;
              state.ui.showProgressIndicator = true;
            }),

          completeViewTransition: () =>
            set((state) => {
              state.navigation.isAnimating = false;
              state.navigation.transitionProgress = 100;
              state.ui.showProgressIndicator = false;
              state.navigation.isAtEdge = false;
              state.navigation.edgeDwellTime = 0;
            }),

          setTransitionProgress: (progress) =>
            set((state) => {
              state.navigation.transitionProgress = progress;
            }),

          // Scroll actions
          updateScrollPosition: (position) =>
            set((state) => {
              const prevY = state.scroll.position.y;
              state.scroll.position = position;

              // Calculate direction
              if (position.y > prevY) {
                state.scroll.direction = 'down';
              } else if (position.y < prevY) {
                state.scroll.direction = 'up';
              }

              // Calculate velocity
              const now = Date.now();
              const timeDiff = now - state.scroll.lastScrollTime;
              if (timeDiff > 0) {
                state.scroll.velocity = Math.abs(position.y - prevY) / timeDiff;
              }
              state.scroll.lastScrollTime = now;
            }),

          setScrollDirection: (direction) =>
            set((state) => {
              state.scroll.direction = direction;
            }),

          setScrollVelocity: (velocity) =>
            set((state) => {
              state.scroll.velocity = velocity;
            }),

          setIsScrolling: (isScrolling) =>
            set((state) => {
              state.scroll.isScrolling = isScrolling;
            }),

          // Edge detection
          setIsAtEdge: (isAtEdge) =>
            set((state) => {
              state.navigation.isAtEdge = isAtEdge;
              if (!isAtEdge) {
                state.navigation.edgeDwellTime = 0;
              }
            }),

          updateEdgeDwellTime: (time) =>
            set((state) => {
              state.navigation.edgeDwellTime = time;
            }),

          resetEdgeDwell: () =>
            set((state) => {
              state.navigation.edgeDwellTime = 0;
              state.navigation.isAtEdge = false;
            }),

          // Preferences
          setPreferences: (preferences) =>
            set((state) => {
              Object.assign(state.preferences, preferences);
            }),

          dismissOnboarding: () =>
            set((state) => {
              state.preferences.hasSeenOnboarding = true;
              state.ui.showOnboarding = false;
            }),

          setDeviceType: (deviceType) =>
            set((state) => {
              state.preferences.deviceType = deviceType;
            }),

          // UI actions
          setLoading: (isLoading) =>
            set((state) => {
              state.ui.isLoading = isLoading;
            }),

          setSearchQuery: (query) =>
            set((state) => {
              state.ui.searchQuery = query;
            }),

          toggleFilter: (filter) =>
            set((state) => {
              const index = state.ui.selectedFilters.indexOf(filter);
              if (index === -1) {
                state.ui.selectedFilters.push(filter);
              } else {
                state.ui.selectedFilters.splice(index, 1);
              }
            }),

          toggleSection: (sectionId) =>
            set((state) => {
              const index = state.ui.expandedSections.indexOf(sectionId);
              if (index === -1) {
                state.ui.expandedSections.push(sectionId);
              } else {
                state.ui.expandedSections.splice(index, 1);
              }
            }),

          // Cache actions
          setCachedData: (type, data) =>
            set((state) => {
              switch (type) {
                case 'hacks':
                  state.cache.cachedHacks = data;
                  break;
                case 'routines':
                  state.cache.cachedRoutines = data;
                  break;
                case 'levels':
                  state.cache.cachedLevels = data;
                  break;
              }
              state.cache.lastFetch = Date.now();
            }),

          invalidateCache: () =>
            set((state) => {
              state.cache.cachedHacks = [];
              state.cache.cachedRoutines = [];
              state.cache.cachedLevels = [];
              state.cache.lastFetch = 0;
            }),

          // Performance
          updatePerformanceMetrics: (metrics) =>
            set((state) => {
              Object.assign(state.performance, metrics);
              state.performance.lastMeasurement = Date.now();
            }),

          // Reset
          reset: () => set(initialState),
        }))
      ),
      {
        name: 'canvas-storage',
        partialize: (state) => ({
          preferences: state.preferences,
          ui: {
            selectedFilters: state.ui.selectedFilters,
            expandedSections: state.ui.expandedSections,
          },
        }),
      }
    ),
    {
      name: 'CanvasStore',
    }
  )
);

// Selectors
export const selectCurrentView = (state: CanvasState) => state.navigation.currentView;
export const selectIsAnimating = (state: CanvasState) => state.navigation.isAnimating;
export const selectScrollPosition = (state: CanvasState) => state.scroll.position;
export const selectIsScrolling = (state: CanvasState) => state.scroll.isScrolling;
export const selectPreferences = (state: CanvasState) => state.preferences;
export const selectIsLoading = (state: CanvasState) => state.ui.isLoading;
export const selectSearchQuery = (state: CanvasState) => state.ui.searchQuery;
export const selectSelectedFilters = (state: CanvasState) => state.ui.selectedFilters;
export const selectCachedHacks = (state: CanvasState) => state.cache.cachedHacks;
export const selectCachedRoutines = (state: CanvasState) => state.cache.cachedRoutines;

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const updateMetrics = useCanvasStore((state) => state.updatePerformanceMetrics);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        updateMetrics({
          frameRate: Math.round((frameCount * 1000) / (currentTime - lastTime))
        });
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFrameRate);
    };

    const rafId = requestAnimationFrame(measureFrameRate);

    return () => cancelAnimationFrame(rafId);
  }, [updateMetrics]);
}