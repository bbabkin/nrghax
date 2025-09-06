import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use service role for test setup/teardown
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Test data
const testUser = {
  email: `test-${randomUUID()}@example.com`,
  password: 'TestPassword123!'
};

const testHack = {
  name: `Test Hack ${randomUUID()}`,
  description: 'This is a test hack description',
  contentType: 'content',
  contentBody: '<p>Test content</p>'
};

test.describe('Hack Creation', () => {
  let userId: string;
  let createdHackIds: string[] = [];

  test.beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    });
    
    if (authError) throw authError;
    userId = authData.user?.id || '';
    
    // Make user admin for testing
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId);
    
    if (profileError) throw profileError;
  });

  test.afterAll(async () => {
    // Clean up created hacks
    if (createdHackIds.length > 0) {
      await supabase
        .from('hacks')
        .delete()
        .in('id', createdHackIds);
    }
    
    // Delete test user
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
  });

  test('should create hack with image path (no image_url)', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard');
    
    // Navigate to hack creation
    await page.goto('/dashboard/hacks/new');
    
    // Fill in hack details
    await page.fill('input[name="name"]', testHack.name);
    await page.fill('textarea[name="description"]', testHack.description);
    
    // Select content type
    await page.click('input[value="content"]');
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Fill content
    await page.fill('[data-testid="content-editor"]', testHack.contentBody);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to hacks list on success
    await page.waitForURL('/dashboard/hacks');
    
    // Verify hack was created
    await expect(page.locator(`text="${testHack.name}"`)).toBeVisible();
    
    // Get created hack ID for cleanup
    const { data: hack } = await supabase
      .from('hacks')
      .select('id')
      .eq('name', testHack.name)
      .single();
    
    if (hack) createdHackIds.push(hack.id);
  });

  test('should handle missing image gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/hacks/new');
    
    // Fill form without image
    await page.fill('input[name="name"]', `${testHack.name} - No Image`);
    await page.fill('textarea[name="description"]', testHack.description);
    await page.click('input[value="content"]');
    await page.fill('[data-testid="content-editor"]', testHack.contentBody);
    
    // Submit without image
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/image.*required/i')).toBeVisible();
  });
});

test.describe('Database Constraints', () => {
  test('should validate hack creation constraints', async () => {
    // Test creating hack with neither image_url nor image_path (should fail)
    const { error: constraintError } = await supabase
      .from('hacks')
      .insert({
        name: 'Test Hack',
        description: 'Test',
        content_type: 'content',
        content_body: '<p>Test</p>',
        // Intentionally omitting both image_url and image_path
      });
    
    expect(constraintError).toBeTruthy();
    expect(constraintError?.message).toContain('hacks_image_check');
    
    // Test creating hack with image_path only (should succeed)
    const { data: hackWithPath, error: pathError } = await supabase
      .from('hacks')
      .insert({
        name: 'Test Hack with Path',
        description: 'Test',
        image_path: 'test/path.jpg',
        content_type: 'content',
        content_body: '<p>Test</p>',
      })
      .select()
      .single();
    
    expect(pathError).toBeFalsy();
    expect(hackWithPath).toBeTruthy();
    
    // Clean up
    if (hackWithPath) {
      await supabase.from('hacks').delete().eq('id', hackWithPath.id);
    }
    
    // Test creating hack with image_url only (should succeed)
    const { data: hackWithUrl, error: urlError } = await supabase
      .from('hacks')
      .insert({
        name: 'Test Hack with URL',
        description: 'Test',
        image_url: 'https://example.com/image.jpg',
        content_type: 'content',
        content_body: '<p>Test</p>',
      })
      .select()
      .single();
    
    expect(urlError).toBeFalsy();
    expect(hackWithUrl).toBeTruthy();
    
    // Clean up
    if (hackWithUrl) {
      await supabase.from('hacks').delete().eq('id', hackWithUrl.id);
    }
  });

  test('should enforce content type constraints', async () => {
    // Test content type with content_body
    const { error: contentError } = await supabase
      .from('hacks')
      .insert({
        name: 'Content Hack',
        description: 'Test',
        image_path: 'test.jpg',
        content_type: 'content',
        external_link: 'https://example.com', // Should fail - can't have both
        content_body: '<p>Test</p>',
      });
    
    expect(contentError).toBeTruthy();
    expect(contentError?.message).toContain('content_xor_link');
    
    // Test link type with external_link
    const { error: linkError } = await supabase
      .from('hacks')
      .insert({
        name: 'Link Hack',
        description: 'Test',
        image_path: 'test.jpg',
        content_type: 'link',
        content_body: '<p>Test</p>', // Should fail - can't have both
        external_link: 'https://example.com',
      });
    
    expect(linkError).toBeTruthy();
    expect(linkError?.message).toContain('content_xor_link');
  });
});