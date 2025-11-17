import { test, expect, Page } from '@playwright/test';

test.describe('Canvas Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the library page
    await page.goto('/library');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Desktop Navigation', () => {
    test('should switch between Skills and Library views using tab clicks', async ({ page }) => {
      // Verify we're on library view
      await expect(page).toHaveURL('/library');
      await expect(page.locator('[aria-label="Hack Library"]')).toBeVisible();

      // Click on Skills tab
      await page.click('text=Skills');
      await page.waitForTimeout(600); // Wait for animation

      // Verify we're on skills view
      await expect(page).toHaveURL('/skills');
      await expect(page.locator('[aria-label="Skills Tree"]')).toBeVisible();

      // Click back to Library tab
      await page.click('text=Library');
      await page.waitForTimeout(600);

      // Verify we're back on library view
      await expect(page).toHaveURL('/library');
    });

    test('should navigate using scroll at edge of view', async ({ page }) => {
      // Verify initial view
      await expect(page).toHaveURL('/library');

      // Scroll to top edge
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200); // Edge dwell time

      // Scroll up to trigger navigation
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(600);

      // Should navigate to skills
      await expect(page).toHaveURL('/skills');

      // Scroll to bottom edge of skills view
      await page.evaluate(() => {
        const element = document.querySelector('[aria-label="Skills Tree"]');
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      });
      await page.waitForTimeout(200);

      // Scroll down to trigger navigation
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(600);

      // Should navigate back to library
      await expect(page).toHaveURL('/library');
    });

    test('should show scroll progress indicator at edge', async ({ page }) => {
      // Scroll to edge
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      // Start scrolling
      await page.mouse.wheel(0, -100);

      // Check for progress indicator
      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();

      // Verify progress bar has aria attributes
      await expect(progressBar).toHaveAttribute('aria-valuenow', /\d+/);
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('should preserve scroll position when navigating away and back', async ({ page }) => {
      // Scroll to a specific position in library
      await page.evaluate(() => window.scrollTo(0, 500));
      const initialScrollPosition = await page.evaluate(() => window.scrollY);

      // Navigate to a hack detail page
      await page.click('.hack-card:first-child');
      await page.waitForLoadState('networkidle');

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Check scroll position is restored
      const restoredScrollPosition = await page.evaluate(() => window.scrollY);
      expect(Math.abs(restoredScrollPosition - initialScrollPosition)).toBeLessThan(50);
    });

    test('should handle keyboard navigation', async ({ page }) => {
      // Focus on the main content
      await page.keyboard.press('Tab');

      // Navigate with Tab key
      await page.keyboard.press('Tab');
      await page.waitForTimeout(600);

      // Should switch view
      await expect(page).toHaveURL('/skills');

      // Navigate back with Shift+Tab
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(600);

      // Should switch back
      await expect(page).toHaveURL('/library');
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });

    test('should navigate with swipe gestures', async ({ page }) => {
      // Initial view
      await expect(page).toHaveURL('/library');

      // Swipe up to navigate to skills
      await page.touchscreen.tap(187, 333);
      await page.touchscreen.swipe({
        start: { x: 187, y: 400 },
        end: { x: 187, y: 100 },
        steps: 10,
      });
      await page.waitForTimeout(600);

      // Should be on skills view
      await expect(page).toHaveURL('/skills');

      // Swipe down to navigate back
      await page.touchscreen.swipe({
        start: { x: 187, y: 100 },
        end: { x: 187, y: 400 },
        steps: 10,
      });
      await page.waitForTimeout(600);

      // Should be back on library
      await expect(page).toHaveURL('/library');
    });

    test('should show mobile-optimized navigation bar', async ({ page }) => {
      // Check for mobile SVG navigation
      const mobileNav = page.locator('.md\\:hidden svg');
      await expect(mobileNav).toBeVisible();

      // Desktop nav should be hidden
      const desktopNav = page.locator('.hidden.md\\:block svg');
      await expect(desktopNav).toBeHidden();
    });

    test('should handle pinch-to-zoom gestures', async ({ page }) => {
      // Initial scale
      const initialScale = await page.evaluate(() => {
        return window.visualViewport?.scale || 1;
      });

      // Simulate pinch zoom
      await page.touchscreen.pinch(187, 333, { scale: 1.5 });
      await page.waitForTimeout(300);

      // Check scale changed
      const newScale = await page.evaluate(() => {
        return window.visualViewport?.scale || 1;
      });

      expect(newScale).toBeGreaterThan(initialScale);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check main regions
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[aria-label="Skills and Library Canvas"]')).toBeVisible();
      await expect(page.locator('[aria-label="View Navigation"]')).toBeVisible();

      // Check skip links
      const skipLinks = page.locator('.skip-link');
      expect(await skipLinks.count()).toBeGreaterThan(0);
    });

    test('should announce view changes to screen readers', async ({ page }) => {
      // Check for live region
      const liveRegion = page.locator('[role="status"][aria-live="polite"]');
      await expect(liveRegion).toBeAttached();

      // Navigate to trigger announcement
      await page.click('text=Skills');
      await page.waitForTimeout(100);

      // Check announcement was made
      const announcement = await liveRegion.textContent();
      expect(announcement).toContain('skills');
    });

    test('should handle reduced motion preference', async ({ page, context }) => {
      // Enable reduced motion
      await context.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();

      // Navigate between views
      await page.click('text=Skills');

      // Animation should be instant (no transition)
      const hasTransition = await page.evaluate(() => {
        const element = document.querySelector('[role="main"] > div');
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.transitionDuration !== '0s';
      });

      expect(hasTransition).toBe(false);
    });

    test('should maintain focus management in modals', async ({ page }) => {
      // Open a hack card (which opens in modal)
      await page.click('.hack-card:first-child');
      await page.waitForTimeout(300);

      // Check focus is trapped in modal
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).toBeTruthy();

      // Tab through modal elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focus should remain in modal
      const stillInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(document.activeElement) || false;
      });
      expect(stillInModal).toBe(true);

      // Escape should close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Modal should be closed
      await expect(page.locator('[role="dialog"]')).toBeHidden();
    });
  });

  test.describe('Performance', () => {
    test('should load with acceptable performance metrics', async ({ page }) => {
      // Measure performance
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };
      });

      // Assert performance thresholds
      expect(metrics.domContentLoaded).toBeLessThan(3000);
      expect(metrics.loadComplete).toBeLessThan(5000);
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    });

    test('should implement virtual scrolling for large datasets', async ({ page }) => {
      // Navigate to skills view
      await page.goto('/skills');

      // Check if virtual scrolling is active
      const hasVirtualScroll = await page.evaluate(() => {
        // Look for react-window elements
        const virtualList = document.querySelector('[style*="will-change: transform"]');
        return virtualList !== null;
      });

      // If there are many items, virtual scrolling should be active
      const itemCount = await page.locator('.hack-card').count();
      if (itemCount > 20) {
        expect(hasVirtualScroll).toBe(true);
      }
    });

    test('should cache data appropriately', async ({ page }) => {
      // First navigation
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Record network requests for second navigation
      const requests: string[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          requests.push(request.url());
        }
      });

      // Navigate away and back
      await page.click('text=Skills');
      await page.waitForTimeout(600);
      await page.click('text=Library');
      await page.waitForTimeout(600);

      // Should use cached data (minimal API calls)
      expect(requests.length).toBeLessThan(5);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle navigation failures gracefully', async ({ page, context }) => {
      // Simulate offline
      await context.setOffline(true);

      // Try to navigate
      await page.click('text=Skills').catch(() => {});
      await page.waitForTimeout(1000);

      // Should show error message
      const errorMessage = page.locator('text=/failed|error|offline/i');
      await expect(errorMessage).toBeVisible();

      // Restore connection
      await context.setOffline(false);
    });

    test('should handle missing data gracefully', async ({ page }) => {
      // Navigate to a non-existent route
      await page.goto('/skills/nonexistent');

      // Should show appropriate message
      await expect(page.locator('text=/not found|404/i')).toBeVisible();
    });
  });

  test.describe('Onboarding', () => {
    test('should show onboarding tooltip for first-time users', async ({ page, context }) => {
      // Clear storage to simulate first-time user
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check for onboarding tooltip
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText(/scroll|navigate|tip/i);

      // Dismiss onboarding
      await page.click('text=Got it');

      // Tooltip should be hidden
      await expect(tooltip).toBeHidden();

      // Refresh page - tooltip should not appear again
      await page.reload();
      await expect(tooltip).toBeHidden();
    });
  });
});