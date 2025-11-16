import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook to handle keyboard navigation with accessibility in mind
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onNavigateUp,
    onNavigateDown,
    onNavigateLeft,
    onNavigateRight,
    onEnter,
    onEscape,
    onTab,
    enabled = true,
    preventDefault = true
  } = options;

  const isHandlingRef = useRef(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || isHandlingRef.current) return;

    // Prevent handling if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    isHandlingRef.current = true;

    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        if (onNavigateUp) {
          onNavigateUp();
          handled = true;
        }
        break;

      case 'ArrowDown':
        if (onNavigateDown) {
          onNavigateDown();
          handled = true;
        }
        break;

      case 'ArrowLeft':
        if (onNavigateLeft) {
          onNavigateLeft();
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (onNavigateRight) {
          onNavigateRight();
          handled = true;
        }
        break;

      case 'Enter':
      case ' ': // Space key
        if (onEnter) {
          onEnter();
          handled = true;
        }
        break;

      case 'Escape':
        if (onEscape) {
          onEscape();
          handled = true;
        }
        break;

      case 'Tab':
        if (onTab) {
          const direction = event.shiftKey ? 'backward' : 'forward';
          onTab(direction);
          handled = true;
        }
        break;
    }

    if (handled && preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Reset handling flag after a short delay
    setTimeout(() => {
      isHandlingRef.current = false;
    }, 50);
  }, [
    enabled,
    preventDefault,
    onNavigateUp,
    onNavigateDown,
    onNavigateLeft,
    onNavigateRight,
    onEnter,
    onEscape,
    onTab
  ]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    isHandling: isHandlingRef.current
  };
}

/**
 * Hook to manage focus trap for modals and overlays
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    enabled?: boolean;
    returnFocus?: boolean;
    initialFocus?: React.RefObject<HTMLElement>;
    onEscape?: () => void;
  } = {}
) {
  const {
    enabled = true,
    returnFocus = true,
    initialFocus,
    onEscape
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Store current focus
    if (returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Set initial focus
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      // Find first focusable element
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Backward tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Forward tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, containerRef, returnFocus, initialFocus, onEscape]);
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details',
    'summary'
  ].join(',');

  const elements = container.querySelectorAll<HTMLElement>(selector);
  return Array.from(elements).filter(el => {
    // Filter out hidden elements
    return el.offsetParent !== null;
  });
}

/**
 * Hook to announce changes to screen readers
 */
export function useAriaAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';

    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return;

    // Update aria-live attribute based on priority
    announcerRef.current.setAttribute('aria-live', priority);

    // Clear and set new message
    announcerRef.current.textContent = '';
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  }, []);

  return { announce };
}

/**
 * Hook for skip links to improve keyboard navigation
 */
export function useSkipLinks() {
  const skipToMain = useCallback(() => {
    const mainElement = document.querySelector('main') || document.getElementById('main-content');
    if (mainElement instanceof HTMLElement) {
      mainElement.focus();
      mainElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const skipToNav = useCallback(() => {
    const navElement = document.querySelector('nav') || document.getElementById('navigation');
    if (navElement instanceof HTMLElement) {
      navElement.focus();
      navElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return { skipToMain, skipToNav };
}