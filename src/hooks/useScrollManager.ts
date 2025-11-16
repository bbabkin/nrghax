import { useEffect, useRef, useCallback, useState, MutableRefObject } from 'react';

interface ScrollManagerOptions {
  storageKey?: string;
  smooth?: boolean;
  offset?: number;
  delay?: number;
}

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * A centralized scroll management hook that provides reliable scroll positioning
 * using IntersectionObserver and RAF instead of unreliable setTimeout calls.
 */
export function useScrollManager(
  containerRef: MutableRefObject<HTMLElement | null>,
  options: ScrollManagerOptions = {}
) {
  const {
    storageKey,
    smooth = true,
    offset = 0,
    delay = 0
  } = options;

  const scrollPositionRef = useRef<ScrollPosition | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollRestoredRef = useRef(false);

  // Save scroll position to session storage
  const saveScrollPosition = useCallback(() => {
    if (!containerRef.current || !storageKey) return;

    const position: ScrollPosition = {
      x: containerRef.current.scrollLeft,
      y: containerRef.current.scrollTop,
      timestamp: Date.now()
    };

    scrollPositionRef.current = position;

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(position));
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  }, [containerRef, storageKey]);

  // Restore scroll position from session storage
  const restoreScrollPosition = useCallback(() => {
    if (!containerRef.current || !storageKey || scrollRestoredRef.current) return;

    try {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (!savedPosition) return;

      const position: ScrollPosition = JSON.parse(savedPosition);

      // Only restore if position was saved recently (within 5 minutes)
      if (Date.now() - position.timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem(storageKey);
        return;
      }

      scrollPositionRef.current = position;

      // Use RAF for smooth restoration
      const restore = () => {
        if (!containerRef.current) return;

        containerRef.current.scrollTo({
          left: position.x,
          top: position.y + offset,
          behavior: smooth ? 'smooth' : 'instant'
        });

        scrollRestoredRef.current = true;
      };

      if (delay > 0) {
        rafIdRef.current = requestAnimationFrame(() => {
          setTimeout(restore, delay);
        });
      } else {
        rafIdRef.current = requestAnimationFrame(restore);
      }
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
    }
  }, [containerRef, storageKey, smooth, offset, delay]);

  // Scroll to a specific element using IntersectionObserver for reliability
  const scrollToElement = useCallback((
    element: HTMLElement,
    options: ScrollIntoViewOptions = {}
  ) => {
    if (!containerRef.current || !element) return;

    const defaultOptions: ScrollIntoViewOptions = {
      behavior: smooth ? 'smooth' : 'instant',
      block: 'center',
      inline: 'nearest',
      ...options
    };

    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create observer to ensure element is visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          element.scrollIntoView(defaultOptions);
        }
      },
      {
        root: containerRef.current,
        threshold: 1.0
      }
    );

    observerRef.current.observe(element);

    // Initial scroll
    element.scrollIntoView(defaultOptions);

    // Clean up observer after scroll completes
    setTimeout(() => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }, 1000);
  }, [containerRef, smooth]);

  // Scroll to a specific position with RAF for smoothness
  const scrollToPosition = useCallback((
    x: number,
    y: number,
    behavior: ScrollBehavior = smooth ? 'smooth' : 'instant'
  ) => {
    if (!containerRef.current) return;

    // Cancel any pending scroll
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      containerRef.current.scrollTo({
        left: x,
        top: y + offset,
        behavior
      });
    });
  }, [containerRef, smooth, offset]);

  // Get current scroll position
  const getScrollPosition = useCallback((): ScrollPosition | null => {
    if (!containerRef.current) return null;

    return {
      x: containerRef.current.scrollLeft,
      y: containerRef.current.scrollTop,
      timestamp: Date.now()
    };
  }, [containerRef]);

  // Check if element is in viewport
  const isElementInViewport = useCallback((element: HTMLElement): boolean => {
    if (!containerRef.current || !element) return false;

    const containerRect = containerRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return (
      elementRect.top >= containerRect.top &&
      elementRect.left >= containerRect.left &&
      elementRect.bottom <= containerRect.bottom &&
      elementRect.right <= containerRect.right
    );
  }, [containerRef]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Save scroll position before unload
  useEffect(() => {
    if (!storageKey) return;

    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveScrollPosition, storageKey]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollToElement,
    scrollToPosition,
    getScrollPosition,
    isElementInViewport
  };
}

/**
 * Hook to detect and respond to prefers-reduced-motion
 */
export function usePrefersReducedMotion() {
  const mediaQuery = useRef<MediaQueryList | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    mediaQuery.current = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Initial check
    setPrefersReducedMotion(mediaQuery.current.matches);

    // Listen for changes
    if (mediaQuery.current.addEventListener) {
      mediaQuery.current.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.current.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.current?.removeEventListener) {
        mediaQuery.current.removeEventListener('change', handleChange);
      } else if (mediaQuery.current?.removeListener) {
        mediaQuery.current.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to manage scroll restoration across navigation
 */
export function useScrollRestoration(
  containerRef: MutableRefObject<HTMLElement | null>,
  key: string
) {
  const scrollManager = useScrollManager(containerRef, {
    storageKey: `scroll-${key}`,
    smooth: false, // Instant restoration for navigation
    delay: 100 // Small delay to ensure DOM is ready
  });

  // Auto-restore on mount
  useEffect(() => {
    scrollManager.restoreScrollPosition();
  }, [scrollManager.restoreScrollPosition]);

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      scrollManager.saveScrollPosition();
    };
  }, [scrollManager.saveScrollPosition]);

  return scrollManager;
}