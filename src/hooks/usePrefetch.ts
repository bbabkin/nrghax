import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasStore } from '@/store/canvas-store';

interface PrefetchOptions {
  enabled?: boolean;
  priority?: 'high' | 'low';
  strategy?: 'hover' | 'viewport' | 'idle' | 'predictive';
  threshold?: number; // For viewport strategy
  delay?: number; // For hover strategy
}

interface PrefetchQueue {
  high: Set<string>;
  low: Set<string>;
}

/**
 * Hook for intelligent prefetching of resources
 */
export function usePrefetch(options: PrefetchOptions = {}) {
  const {
    enabled = true,
    priority = 'low',
    strategy = 'idle',
    threshold = 0.5,
    delay = 100,
  } = options;

  const router = useRouter();
  const prefetchQueue = useRef<PrefetchQueue>({
    high: new Set(),
    low: new Set(),
  });
  const prefetchedUrls = useRef<Set<string>>(new Set());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleCallbackRef = useRef<number | null>(null);

  // Get current view from store for predictive prefetching
  const currentView = useCanvasStore((state) => state.navigation.currentView);

  /**
   * Prefetch a URL
   */
  const prefetchUrl = useCallback((url: string, urlPriority: 'high' | 'low' = 'low') => {
    if (!enabled || prefetchedUrls.current.has(url)) return;

    // Add to queue
    prefetchQueue.current[urlPriority].add(url);

    // Mark as prefetched
    prefetchedUrls.current.add(url);

    // Use Next.js router prefetch
    router.prefetch(url);

    // Also prefetch resources
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      document.head.appendChild(link);
    }
  }, [enabled, router]);

  /**
   * Prefetch data via API
   */
  const prefetchData = useCallback(async (endpoint: string, cacheKey: string) => {
    if (!enabled) return;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Store in canvas store cache
        const { setCachedData } = useCanvasStore.getState();

        if (cacheKey === 'hacks' || cacheKey === 'routines' || cacheKey === 'levels') {
          setCachedData(cacheKey, data);
        }

        // Also store in session storage
        sessionStorage.setItem(`prefetch_${cacheKey}`, JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [enabled]);

  /**
   * Prefetch images
   */
  const prefetchImage = useCallback((src: string) => {
    if (!enabled || !src) return;

    const img = new Image();
    img.src = src;
    img.loading = 'lazy';
  }, [enabled]);

  /**
   * Strategy: Hover - Prefetch when user hovers over a link
   */
  const handleHoverPrefetch = useCallback((element: HTMLElement) => {
    if (strategy !== 'hover') return;

    const url = element.getAttribute('href');
    if (!url) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set new timeout
    hoverTimeoutRef.current = setTimeout(() => {
      prefetchUrl(url, 'high');
    }, delay);
  }, [strategy, delay, prefetchUrl]);

  /**
   * Strategy: Viewport - Prefetch when element enters viewport
   */
  const setupViewportPrefetch = useCallback(() => {
    if (strategy !== 'viewport' || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const url = element.getAttribute('href');

            if (url) {
              prefetchUrl(url, 'low');
            }

            // Also prefetch images in the element
            const images = element.querySelectorAll('img[data-src]');
            images.forEach((img) => {
              const src = img.getAttribute('data-src');
              if (src) {
                prefetchImage(src);
              }
            });

            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold,
      }
    );

    // Observe all links and cards
    const elements = document.querySelectorAll('a[href], .hack-card, .routine-card');
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [strategy, enabled, threshold, prefetchUrl, prefetchImage]);

  /**
   * Strategy: Idle - Prefetch during idle time
   */
  const setupIdlePrefetch = useCallback(() => {
    if (strategy !== 'idle' || !enabled) return;

    const performIdlePrefetch = () => {
      // Prefetch based on current view
      if (currentView === 'skills') {
        // User is on skills, prefetch library data
        prefetchData('/api/library/hacks', 'hacks');
        prefetchData('/api/library/routines', 'routines');
        prefetchUrl('/library', 'low');
      } else {
        // User is on library, prefetch skills data
        prefetchData('/api/skills/levels', 'levels');
        prefetchUrl('/skills', 'low');
      }

      // Prefetch common routes
      const commonRoutes = ['/profile', '/settings', '/admin'];
      commonRoutes.forEach((route) => prefetchUrl(route, 'low'));
    };

    if ('requestIdleCallback' in window) {
      idleCallbackRef.current = requestIdleCallback(performIdlePrefetch, {
        timeout: 2000,
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(performIdlePrefetch, 1000);
    }

    return () => {
      if (idleCallbackRef.current) {
        cancelIdleCallback(idleCallbackRef.current);
      }
    };
  }, [strategy, enabled, currentView, prefetchUrl, prefetchData]);

  /**
   * Strategy: Predictive - Prefetch based on user behavior patterns
   */
  const setupPredictivePrefetch = useCallback(() => {
    if (strategy !== 'predictive' || !enabled) return;

    // Analyze user navigation patterns from store
    const { navigation } = useCanvasStore.getState();
    const { currentView, previousView } = navigation;

    // Predictive rules
    const predictions: string[] = [];

    // If user just switched views, they might switch back
    if (previousView) {
      predictions.push(`/${previousView}`);
    }

    // Based on current view, predict likely next actions
    if (currentView === 'skills') {
      // On skills page, likely to view specific hacks
      predictions.push('/skills/foundation');
      predictions.push('/skills/level-1');
    } else if (currentView === 'library') {
      // On library, likely to search or filter
      predictions.push('/library?filter=completed');
      predictions.push('/library?filter=new');
    }

    // Time-based predictions
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // During work hours, prefetch productivity-related content
      predictions.push('/routines/productivity');
    } else {
      // Evening, prefetch relaxation content
      predictions.push('/routines/relaxation');
    }

    // Prefetch predictions
    predictions.forEach((url) => prefetchUrl(url, 'low'));

    // Also prefetch based on user's recent activity
    const recentActivity = sessionStorage.getItem('recentActivity');
    if (recentActivity) {
      try {
        const activities = JSON.parse(recentActivity);
        activities.slice(0, 3).forEach((activity: { url: string }) => {
          prefetchUrl(activity.url, 'low');
        });
      } catch (error) {
        console.warn('Failed to parse recent activity:', error);
      }
    }
  }, [strategy, enabled, prefetchUrl]);

  /**
   * Setup prefetching based on strategy
   */
  useEffect(() => {
    if (!enabled) return;

    let cleanup: (() => void) | undefined;

    switch (strategy) {
      case 'hover':
        // Set up hover listeners
        const links = document.querySelectorAll('a[href]');
        const handleMouseEnter = (e: Event) => {
          handleHoverPrefetch(e.target as HTMLElement);
        };
        const handleMouseLeave = () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
        };

        links.forEach((link) => {
          link.addEventListener('mouseenter', handleMouseEnter);
          link.addEventListener('mouseleave', handleMouseLeave);
        });

        cleanup = () => {
          links.forEach((link) => {
            link.removeEventListener('mouseenter', handleMouseEnter);
            link.removeEventListener('mouseleave', handleMouseLeave);
          });
        };
        break;

      case 'viewport':
        cleanup = setupViewportPrefetch();
        break;

      case 'idle':
        cleanup = setupIdlePrefetch();
        break;

      case 'predictive':
        cleanup = setupPredictivePrefetch();
        break;
    }

    return cleanup;
  }, [
    enabled,
    strategy,
    handleHoverPrefetch,
    setupViewportPrefetch,
    setupIdlePrefetch,
    setupPredictivePrefetch,
  ]);

  /**
   * Manual prefetch function
   */
  const prefetch = useCallback((urls: string | string[], urlPriority?: 'high' | 'low') => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    urlArray.forEach((url) => prefetchUrl(url, urlPriority || priority));
  }, [prefetchUrl, priority]);

  /**
   * Clear prefetch cache
   */
  const clearCache = useCallback(() => {
    prefetchedUrls.current.clear();
    prefetchQueue.current.high.clear();
    prefetchQueue.current.low.clear();

    // Clear session storage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('prefetch_')) {
        sessionStorage.removeItem(key);
      }
    });
  }, []);

  /**
   * Get cached data
   */
  const getCachedData = useCallback((cacheKey: string) => {
    const cached = sessionStorage.getItem(`prefetch_${cacheKey}`);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);

      // Check if cache is still valid (5 minutes)
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
    }

    return null;
  }, []);

  return {
    prefetch,
    prefetchData,
    prefetchImage,
    clearCache,
    getCachedData,
    queueSize: prefetchQueue.current.high.size + prefetchQueue.current.low.size,
    prefetchedCount: prefetchedUrls.current.size,
  };
}

/**
 * Service Worker prefetch registration
 */
export function registerPrefetchServiceWorker() {
  if ('serviceWorker' in navigator && 'PrefetchEvent' in window) {
    navigator.serviceWorker.register('/prefetch-sw.js').then((registration) => {
      console.log('Prefetch Service Worker registered:', registration);
    }).catch((error) => {
      console.warn('Prefetch Service Worker registration failed:', error);
    });
  }
}

/**
 * Resource hints component (to be added to document head)
 */
export function getResourceHints(currentPath: string): string[] {
  const hints: string[] = [];

  // DNS prefetch for external domains
  hints.push('<link rel="dns-prefetch" href="https://fonts.googleapis.com">');
  hints.push('<link rel="dns-prefetch" href="https://fonts.gstatic.com">');

  // Preconnect to API endpoints
  if (process.env.NEXT_PUBLIC_API_URL) {
    hints.push(`<link rel="preconnect" href="${process.env.NEXT_PUBLIC_API_URL}">`);
  }

  // Route-specific prefetching
  if (currentPath === '/') {
    // Homepage - prefetch main sections
    hints.push('<link rel="prefetch" href="/skills" as="document">');
    hints.push('<link rel="prefetch" href="/library" as="document">');
  } else if (currentPath.startsWith('/skills')) {
    // Skills page - prefetch library
    hints.push('<link rel="prefetch" href="/library" as="document">');
  } else if (currentPath.startsWith('/library')) {
    // Library page - prefetch skills
    hints.push('<link rel="prefetch" href="/skills" as="document">');
  }

  return hints;
}