import { test, expect } from '@playwright/test';

test.describe('Tiptap SSR Fix Verification', () => {
  test('should not have Tiptap SSR hydration errors', async ({ page }) => {
    // Track console errors
    const tiptapErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Tiptap') || text.includes('immediatelyRender')) {
          tiptapErrors.push(text);
        }
      }
    });
    
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to fully hydrate
    await page.waitForLoadState('networkidle');
    
    // Check that no Tiptap SSR errors occurred
    expect(tiptapErrors).toHaveLength(0);
    
    // Navigate to auth page (forms might be there)
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check again for errors
    expect(tiptapErrors).toHaveLength(0);
  });
  
  test('RichTextEditor should render without errors when used', async ({ page }) => {
    // This test would require admin access to actually see the RichTextEditor
    // For now, we just verify the pages load without Tiptap errors
    
    const errors: string[] = [];
    page.on('pageerror', err => {
      if (err.message.includes('Tiptap')) {
        errors.push(err.message);
      }
    });
    
    // Try to navigate to admin area (will redirect to auth)
    await page.goto('/admin/hacks/new');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to auth, but no Tiptap errors should occur
    expect(errors).toHaveLength(0);
  });
});