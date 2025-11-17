import { useEffect, useRef, useCallback, useState } from 'react';
import { useCanvasStore } from '@/store/canvas-store';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  scrollFPS: number;
  animationDroppedFrames: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
}

interface PerformanceThresholds {
  fps: { min: number; target: number };
  renderTime: { max: number; warning: number };
  memoryUsage: { max: number; warning: number };
  networkLatency: { max: number; warning: number };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { min: 30, target: 60 },
  renderTime: { max: 16, warning: 8 },
  memoryUsage: { max: 100, warning: 50 }, // MB
  networkLatency: { max: 1000, warning: 500 }, // ms
};

/**
 * Comprehensive performance monitoring hook
 */
export function usePerformanceMonitor(options: {
  enabled?: boolean;
  thresholds?: Partial<PerformanceThresholds>;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onPerformanceIssue?: (issue: string, severity: 'low' | 'medium' | 'high') => void;
  sampleRate?: number; // Percentage of users to monitor (0-100)
} = {}) {
  const {
    enabled = true,
    thresholds = DEFAULT_THRESHOLDS,
    onMetricsUpdate,
    onPerformanceIssue,
    sampleRate = 100,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    scrollFPS: 60,
    animationDroppedFrames: 0,
    timeToInteractive: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    interactionToNextPaint: 0,
  });

  const updateStoreMetrics = useCanvasStore((state) => state.updatePerformanceMetrics);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Determine if this user should be monitored
  const shouldMonitor = useRef(Math.random() * 100 < sampleRate);

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now();

    if (lastFrameTimeRef.current) {
      const delta = now - lastFrameTimeRef.current;
      frameTimesRef.current.push(delta);

      // Keep only last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate FPS
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = Math.round(1000 / avgFrameTime);

      setMetrics((prev) => ({ ...prev, fps }));
      updateStoreMetrics({ frameRate: fps });

      // Check for performance issues
      if (fps < thresholds.fps?.min) {
        onPerformanceIssue?.(`Low FPS: ${fps}`, 'high');
      } else if (fps < thresholds.fps?.target) {
        onPerformanceIssue?.(`Below target FPS: ${fps}`, 'medium');
      }
    }

    lastFrameTimeRef.current = now;
    rafIdRef.current = requestAnimationFrame(measureFPS);
  }, [thresholds, onPerformanceIssue, updateStoreMetrics]);

  // Memory usage monitoring
  const measureMemory = useCallback(async () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemoryMB = Math.round(memory.usedJSHeapSize / 1048576);

      setMetrics((prev) => ({ ...prev, memoryUsage: usedMemoryMB }));

      // Check memory usage
      if (usedMemoryMB > thresholds.memoryUsage?.max) {
        onPerformanceIssue?.(`High memory usage: ${usedMemoryMB}MB`, 'high');
      } else if (usedMemoryMB > thresholds.memoryUsage?.warning) {
        onPerformanceIssue?.(`Memory usage warning: ${usedMemoryMB}MB`, 'medium');
      }
    }
  }, [thresholds, onPerformanceIssue]);

  // Network latency monitoring
  const measureNetworkLatency = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const latency = navigation.responseStart - navigation.fetchStart;
      setMetrics((prev) => ({ ...prev, networkLatency: Math.round(latency) }));

      if (latency > thresholds.networkLatency?.max) {
        onPerformanceIssue?.(`High network latency: ${Math.round(latency)}ms`, 'high');
      }
    }
  }, [thresholds, onPerformanceIssue]);

  // Web Vitals monitoring
  const measureWebVitals = useCallback(() => {
    if (!observerRef.current && 'PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics((prev) => ({
                  ...prev,
                  firstContentfulPaint: Math.round(entry.startTime),
                }));
              }
              break;

            case 'largest-contentful-paint':
              setMetrics((prev) => ({
                ...prev,
                largestContentfulPaint: Math.round(entry.startTime),
              }));
              break;

            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics((prev) => ({
                  ...prev,
                  cumulativeLayoutShift: prev.cumulativeLayoutShift + (entry as any).value,
                }));
              }
              break;

            case 'first-input':
              setMetrics((prev) => ({
                ...prev,
                firstInputDelay: Math.round((entry as any).processingStart - entry.startTime),
              }));
              break;
          }
        }
      });

      // Observe various performance metrics
      try {
        observerRef.current.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
      } catch (e) {
        // Some entry types might not be supported
        console.warn('Some performance metrics not available:', e);
      }
    }
  }, []);

  // Scroll performance monitoring
  const measureScrollPerformance = useCallback(() => {
    let scrollFrames = 0;
    let scrollStartTime = 0;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        scrollStartTime = performance.now();
        scrollFrames = 0;
      }

      scrollFrames++;
    };

    const handleScrollEnd = () => {
      if (isScrolling) {
        const duration = performance.now() - scrollStartTime;
        const scrollFPS = Math.round((scrollFrames * 1000) / duration);

        setMetrics((prev) => ({ ...prev, scrollFPS }));

        if (scrollFPS < 30) {
          onPerformanceIssue?.(`Poor scroll performance: ${scrollFPS} FPS`, 'medium');
        }

        isScrolling = false;
      }
    };

    let scrollTimeout: NodeJS.Timeout;
    const debouncedScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', debouncedScrollEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', debouncedScrollEnd);
      clearTimeout(scrollTimeout);
    };
  }, [onPerformanceIssue]);

  // Animation frame monitoring
  const measureAnimationPerformance = useCallback(() => {
    let droppedFrames = 0;
    let lastTime = performance.now();
    const targetFrameTime = 1000 / 60; // 16.67ms for 60fps

    const checkFrame = () => {
      const now = performance.now();
      const delta = now - lastTime;

      if (delta > targetFrameTime * 1.5) {
        droppedFrames++;
        setMetrics((prev) => ({ ...prev, animationDroppedFrames: droppedFrames }));

        if (droppedFrames > 10) {
          onPerformanceIssue?.(`Animation dropping frames: ${droppedFrames} dropped`, 'low');
        }
      }

      lastTime = now;
    };

    const interval = setInterval(checkFrame, targetFrameTime);
    return () => clearInterval(interval);
  }, [onPerformanceIssue]);

  // Initialize monitoring
  useEffect(() => {
    if (!enabled || !shouldMonitor.current) return;

    // Start FPS monitoring
    measureFPS();

    // Start memory monitoring
    const memoryInterval = setInterval(measureMemory, 5000);

    // Measure initial network latency
    measureNetworkLatency();

    // Start Web Vitals monitoring
    measureWebVitals();

    // Start scroll performance monitoring
    const cleanupScroll = measureScrollPerformance();

    // Start animation performance monitoring
    const cleanupAnimation = measureAnimationPerformance();

    // Cleanup
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      clearInterval(memoryInterval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      cleanupScroll();
      cleanupAnimation();
    };
  }, [
    enabled,
    measureFPS,
    measureMemory,
    measureNetworkLatency,
    measureWebVitals,
    measureScrollPerformance,
    measureAnimationPerformance,
  ]);

  // Notify about metrics updates
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Public API
  return {
    metrics,
    isMonitoring: enabled && shouldMonitor.current,
    startMonitoring: () => measureFPS(),
    stopMonitoring: () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    },
    reportCustomMetric: (name: string, value: number) => {
      // Send to analytics service
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'performance_metric', {
          event_category: 'Performance',
          event_label: name,
          value,
        });
      }
    },
  };
}

/**
 * Analytics integration hook
 */
export function useAnalytics() {
  const sendEvent = useCallback((eventName: string, eventData?: Record<string, any>) => {
    // Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', eventName, eventData);
    }

    // Custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          data: eventData,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(console.error);
    }
  }, []);

  const trackNavigation = useCallback((from: string, to: string, method: 'click' | 'scroll' | 'swipe' | 'keyboard') => {
    sendEvent('navigation', {
      from,
      to,
      method,
      timestamp: Date.now(),
    });
  }, [sendEvent]);

  const trackInteraction = useCallback((element: string, action: string, value?: any) => {
    sendEvent('interaction', {
      element,
      action,
      value,
      timestamp: Date.now(),
    });
  }, [sendEvent]);

  const trackError = useCallback((error: string, severity: 'low' | 'medium' | 'high', context?: any) => {
    sendEvent('error', {
      error,
      severity,
      context,
      timestamp: Date.now(),
    });
  }, [sendEvent]);

  const trackTiming = useCallback((category: string, variable: string, time: number, label?: string) => {
    sendEvent('timing', {
      event_category: category,
      event_label: label,
      value: time,
      timing_variable: variable,
    });
  }, [sendEvent]);

  return {
    sendEvent,
    trackNavigation,
    trackInteraction,
    trackError,
    trackTiming,
  };
}