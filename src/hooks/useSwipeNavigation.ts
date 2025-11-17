import { useEffect, useRef, useCallback } from 'react';
import { useSwipeable, SwipeableHandlers } from 'react-swipeable';
import { useCanvasStore } from '@/store/canvas-store';
import { DEVICE_CONFIG } from '@/config/canvas.config';

interface UseSwipeNavigationOptions {
  enabled?: boolean;
  threshold?: number;
  velocity?: number;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  preventDefaultTouchmoveEvent?: boolean;
  trackTouch?: boolean;
  trackMouse?: boolean;
  rotationAngle?: number;
}

interface SwipeState {
  swiping: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | null;
  deltaX: number;
  deltaY: number;
  velocity: number;
  startTime: number;
}

/**
 * Hook for handling swipe gestures with integration to canvas navigation
 */
export function useSwipeNavigation(options: UseSwipeNavigationOptions = {}): SwipeableHandlers {
  const {
    enabled = true,
    threshold = DEVICE_CONFIG.TOUCH_SWIPE_THRESHOLD,
    velocity = DEVICE_CONFIG.TOUCH_SWIPE_VELOCITY,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    preventDefaultTouchmoveEvent = false,
    trackTouch = true,
    trackMouse = false,
    rotationAngle = 0,
  } = options;

  // Get canvas store actions
  const {
    currentView,
    isAnimating,
    setCurrentView,
    startViewTransition,
    completeViewTransition,
    setDeviceType,
  } = useCanvasStore((state) => ({
    currentView: state.navigation.currentView,
    isAnimating: state.navigation.isAnimating,
    setCurrentView: state.setCurrentView,
    startViewTransition: state.startViewTransition,
    completeViewTransition: state.completeViewTransition,
    setDeviceType: state.setDeviceType,
  }));

  const swipeStateRef = useRef<SwipeState>({
    swiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    startTime: Date.now(),
  });

  // Handle vertical swipe for view navigation
  const handleVerticalSwipe = useCallback((direction: 'up' | 'down') => {
    if (!enabled || isAnimating) return;

    // Set device type to touch
    setDeviceType('touch');

    if (direction === 'up' && currentView === 'skills') {
      // Swipe up from skills to library
      startViewTransition('library');
      setCurrentView('library', true);
      setTimeout(completeViewTransition, 500);
      onSwipeUp?.();
    } else if (direction === 'down' && currentView === 'library') {
      // Swipe down from library to skills
      startViewTransition('skills');
      setCurrentView('skills', true);
      setTimeout(completeViewTransition, 500);
      onSwipeDown?.();
    }
  }, [
    enabled,
    isAnimating,
    currentView,
    setDeviceType,
    startViewTransition,
    setCurrentView,
    completeViewTransition,
    onSwipeUp,
    onSwipeDown,
  ]);

  // Handle horizontal swipe (for future use)
  const handleHorizontalSwipe = useCallback((direction: 'left' | 'right') => {
    if (!enabled || isAnimating) return;

    if (direction === 'left') {
      onSwipeLeft?.();
    } else if (direction === 'right') {
      onSwipeRight?.();
    }
  }, [enabled, isAnimating, onSwipeLeft, onSwipeRight]);

  // Create swipeable handlers
  const handlers = useSwipeable({
    onSwiped: (eventData) => {
      if (!enabled) return;

      const { dir, velocity: swipeVelocity } = eventData;

      // Check if swipe meets velocity threshold
      if (Math.abs(swipeVelocity) < velocity) return;

      switch (dir) {
        case 'Up':
          handleVerticalSwipe('up');
          break;
        case 'Down':
          handleVerticalSwipe('down');
          break;
        case 'Left':
          handleHorizontalSwipe('left');
          break;
        case 'Right':
          handleHorizontalSwipe('right');
          break;
      }
    },
    onSwiping: (eventData) => {
      if (!enabled) return;

      const { deltaX, deltaY, dir, velocity: currentVelocity } = eventData;

      // Update swipe state
      swipeStateRef.current = {
        swiping: true,
        direction: dir.toLowerCase() as any,
        deltaX,
        deltaY,
        velocity: currentVelocity,
        startTime: swipeStateRef.current.startTime || Date.now(),
      };

      // Visual feedback could be added here
      // For example, showing a preview of the next view
    },
    onSwipedUp: () => {
      swipeStateRef.current.swiping = false;
      swipeStateRef.current.direction = null;
    },
    onSwipedDown: () => {
      swipeStateRef.current.swiping = false;
      swipeStateRef.current.direction = null;
    },
    onSwipedLeft: () => {
      swipeStateRef.current.swiping = false;
      swipeStateRef.current.direction = null;
    },
    onSwipedRight: () => {
      swipeStateRef.current.swiping = false;
      swipeStateRef.current.direction = null;
    },
    preventDefaultTouchmoveEvent,
    trackTouch,
    trackMouse,
    rotationAngle,
    delta: threshold,
  });

  return handlers;
}

/**
 * Hook for visual swipe feedback
 */
export function useSwipeFeedback() {
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isSwipingState, setIsSwipingState] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const { deltaX, deltaY } = eventData;

      // Apply damping to the offset for smooth visual feedback
      const dampingFactor = 0.3;
      setSwipeOffset({
        x: deltaX * dampingFactor,
        y: deltaY * dampingFactor,
      });
      setIsSwipingState(true);
    },
    onSwiped: () => {
      // Reset offset with animation
      setSwipeOffset({ x: 0, y: 0 });
      setIsSwipingState(false);
    },
    trackTouch: true,
  });

  return {
    handlers,
    swipeOffset,
    isSwipingState,
  };
}

/**
 * Hook for pinch-to-zoom gestures
 */
export function usePinchZoom(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    minScale?: number;
    maxScale?: number;
    enabled?: boolean;
  } = {}
) {
  const { minScale = 0.5, maxScale = 3, enabled = true } = options;

  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const lastDistance = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        lastDistance.current = getDistance(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDistance.current) {
        e.preventDefault();

        const distance = getDistance(e.touches[0], e.touches[1]);
        const delta = distance / lastDistance.current;

        setScale((prevScale) => {
          const newScale = prevScale * delta;
          return Math.min(Math.max(newScale, minScale), maxScale);
        });

        lastDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      setIsPinching(false);
      lastDistance.current = null;
    };

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, elementRef, minScale, maxScale]);

  return {
    scale,
    isPinching,
    resetScale: () => setScale(1),
  };
}

// Import useState
import { useState } from 'react';