import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

test.describe('Profile History Page', () => {
  const testUser = {
    email: `test-${randomUUID()}@example.com`,
    password: 'TestPassword123!'
  };
  
  let userId: string;
  let hackId: string;

  test.beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    });
    
    if (authError) throw authError;
    userId = authData.user?.id || '';
    
    // Create a test hack
    const { data: hack, error: hackError } = await supabase
      .from('hacks')
      .insert({
        name: 'Test Hack for History',
        description: 'Test hack description',
        image_url: 'https://example.com/test.jpg',
        content_type: 'content',
        content_body: '<p>Test content</p>'
      })
      .select()
      .single();
    
    if (hackError) throw hackError;
    hackId = hack.id;
    
    // Mark hack as completed
    await supabase
      .from('user_hack_completions')
      .insert({
        user_id: userId,
        hack_id: hackId
      });
  });

  test.afterAll(async () => {
    // Cleanup
    if (hackId) {
      await supabase.from('hacks').delete().eq('id', hackId);
    }
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/profile/history');
    await expect(page).toHaveURL(/\/auth\?redirect=%2Fprofile%2Fhistory/);
  });

  test('should show completed hacks when authenticated', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard');
    
    // Navigate to history page
    await page.goto('/profile/history');
    
    // Should see the completed hack
    await expect(page.locator('h1')).toContainText('Learning History');
    await expect(page.locator('text="Test Hack for History"')).toBeVisible();
    await expect(page.locator('text="1 Hack Completed"')).toBeVisible();
  });

  test('should show empty state when no completed hacks', async ({ page }) => {
    // Create another user with no completions
    const emptyUser = {
      email: `empty-${randomUUID()}@example.com`,
      password: 'TestPassword123!'
    };
    
    const { data: authData } = await supabase.auth.signUp({
      email: emptyUser.email,
      password: emptyUser.password
    });
    
    // Login as empty user
    await page.goto('/login');
    await page.fill('input[name="email"]', emptyUser.email);
    await page.fill('input[name="password"]', emptyUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    await page.goto('/profile/history');
    
    // Should see empty state
    await expect(page.locator('text="No Completed Hacks Yet"')).toBeVisible();
    await expect(page.locator('text="Browse Hacks"')).toBeVisible();
    
    // Cleanup
    if (authData?.user?.id) {
      await supabase.auth.admin.deleteUser(authData.user.id);
    }
  });

  test('should handle missing images gracefully', async ({ page }) => {
    // Create hack without image
    const { data: noImageHack } = await supabase
      .from('hacks')
      .insert({
        name: 'No Image Hack',
        description: 'Hack without image',
        image_url: null,
        image_path: null,
        content_type: 'content',
        content_body: '<p>Content</p>'
      })
      .select()
      .single();
    
    if (noImageHack) {
      // Mark as completed
      await supabase
        .from('user_hack_completions')
        .insert({
          user_id: userId,
          hack_id: noImageHack.id
        });
      
      // Login and check
      await page.goto('/login');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard');
      await page.goto('/profile/history');
      
      // Should show placeholder image
      await expect(page.locator('text="No Image Hack"')).toBeVisible();
      await expect(page.locator('img[src*="placeholder"]')).toBeVisible();
      
      // Cleanup
      await supabase.from('hacks').delete().eq('id', noImageHack.id);
    }
  });
});