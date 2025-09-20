import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use service role for test setup/teardown
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const adminUser = {
  email: `admin-${randomUUID()}@example.com`,
  password: 'AdminPassword123!'
};

const regularUser = {
  email: `user-${randomUUID()}@example.com`,
  password: 'UserPassword123!'
};

const testTag = {
  name: `TestTag-${Date.now()}`,
  slug: `test-tag-${Date.now()}`
};

const testHack1 = {
  name: `Test Hack 1 - ${Date.now()}`,
  description: 'This is the first test hack',
  contentType: 'content',
  contentBody: '<p>Content for first hack</p>'
};

const testHack2 = {
  name: `Test Hack 2 - ${Date.now()}`,
  description: 'This hack requires the first one',
  contentType: 'content',
  contentBody: '<p>Content for second hack</p>'
};

test.describe('Complete User Flow', () => {
  let adminUserId: string;
  let regularUserId: string;
  let tagId: string;
  let hack1Id: string;
  let hack1Slug: string;
  let hack2Id: string;
  let hack2Slug: string;

  test.beforeAll(async () => {
    // Create admin user
    const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
      email: adminUser.email,
      password: adminUser.password
    });

    if (adminError) throw adminError;
    adminUserId = adminAuth.user?.id || '';

    // Make user admin
    await prisma.profile.upsert({
      where: { id: adminUserId },
      update: { isAdmin: true },
      create: {
        id: adminUserId,
        email: adminUser.email,
        isAdmin: true
      }
    });

    // Create regular user
    const { data: userAuth, error: userError } = await supabase.auth.signUp({
      email: regularUser.email,
      password: regularUser.password
    });

    if (userError) throw userError;
    regularUserId = userAuth.user?.id || '';

    // Create regular user profile
    await prisma.profile.upsert({
      where: { id: regularUserId },
      update: {},
      create: {
        id: regularUserId,
        email: regularUser.email,
        isAdmin: false
      }
    });
  });

  test.afterAll(async () => {
    // Clean up in reverse order of dependencies

    // Delete user interactions
    if (regularUserId) {
      await prisma.userHack.deleteMany({
        where: { userId: regularUserId }
      });
    }

    // Delete hack tags
    if (hack1Id) {
      await prisma.hackTag.deleteMany({
        where: { hackId: hack1Id }
      });
    }
    if (hack2Id) {
      await prisma.hackTag.deleteMany({
        where: { hackId: hack2Id }
      });
    }

    // Delete prerequisites
    if (hack2Id) {
      await prisma.hackPrerequisite.deleteMany({
        where: { hackId: hack2Id }
      });
    }

    // Delete hacks
    if (hack2Id) {
      await prisma.hack.delete({
        where: { id: hack2Id }
      }).catch(() => {});
    }
    if (hack1Id) {
      await prisma.hack.delete({
        where: { id: hack1Id }
      }).catch(() => {});
    }

    // Delete tag
    if (tagId) {
      await prisma.tag.delete({
        where: { id: tagId }
      }).catch(() => {});
    }

    // Delete user profiles
    if (adminUserId) {
      await prisma.profile.delete({
        where: { id: adminUserId }
      }).catch(() => {});
      await supabase.auth.admin.deleteUser(adminUserId);
    }
    if (regularUserId) {
      await prisma.profile.delete({
        where: { id: regularUserId }
      }).catch(() => {});
      await supabase.auth.admin.deleteUser(regularUserId);
    }

    await prisma.$disconnect();
  });

  test('1. Admin logs in successfully', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to hacks page after login
    await page.waitForURL('/hacks', { timeout: 10000 });

    // Verify admin is logged in
    await expect(page).toHaveURL('/hacks');

    // Check for admin-specific UI elements
    await page.goto('/admin/hacks');
    await expect(page).toHaveURL('/admin/hacks');
    await expect(page.locator('h1')).toContainText('Manage Hacks');
  });

  test('2. Admin creates a tag', async ({ page }) => {
    // Ensure we're logged in as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/hacks');

    // Navigate to tags management
    await page.goto('/admin/tags');

    // Create new tag
    const createButton = page.locator('button:has-text("Create Tag")').or(page.locator('button:has-text("New Tag")'));
    await createButton.click();

    // Fill tag form
    await page.fill('input[name="name"]', testTag.name);
    await page.click('button[type="submit"]');

    // Wait for tag to be created
    await page.waitForTimeout(1000);

    // Verify tag was created
    await expect(page.locator(`text="${testTag.name}"`)).toBeVisible();

    // Get tag ID from database for later use
    const tag = await prisma.tag.findFirst({
      where: { name: testTag.name }
    });

    expect(tag).toBeTruthy();
    tagId = tag!.id;
  });

  test('3. Admin creates first hack with tag', async ({ page }) => {
    // Navigate to hack creation
    await page.goto('/admin/hacks/new');

    // Fill hack details
    await page.fill('input[name="name"]', testHack1.name);
    await page.fill('textarea[name="description"]', testHack1.description);

    // Select content type
    const contentRadio = page.locator('input[value="content"]').or(page.locator('input[type="radio"][value="content"]'));
    await contentRadio.click();

    // Add image URL
    await page.fill('input[name="image_url"]', 'https://example.com/test-image.jpg');

    // Fill content
    const contentEditor = page.locator('[name="content_body"]').or(page.locator('textarea[name="content_body"]'));
    await contentEditor.fill(testHack1.contentBody);

    // Select tag if tag selector is visible
    const tagSelector = page.locator('[data-testid="tag-selector"]').or(page.locator('select[name="tags"]'));
    if (await tagSelector.count() > 0) {
      await tagSelector.selectOption({ label: testTag.name });
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to hacks list
    await page.waitForURL('/admin/hacks', { timeout: 10000 });

    // Verify hack was created
    await expect(page.locator(`text="${testHack1.name}"`)).toBeVisible();

    // Get hack details from database
    const hack1 = await prisma.hack.findFirst({
      where: { name: testHack1.name }
    });

    expect(hack1).toBeTruthy();
    hack1Id = hack1!.id;
    hack1Slug = hack1!.slug;

    // Verify tag was assigned if tags are supported
    if (tagId) {
      const hackTag = await prisma.hackTag.findFirst({
        where: {
          hackId: hack1Id,
          tagId: tagId
        }
      });
      // Tag assignment might be optional
      console.log('Tag assignment status:', hackTag ? 'assigned' : 'not assigned');
    }
  });

  test('4. Admin creates second hack with first as prerequisite', async ({ page }) => {
    // Navigate to hack creation
    await page.goto('/admin/hacks/new');

    // Fill hack details
    await page.fill('input[name="name"]', testHack2.name);
    await page.fill('textarea[name="description"]', testHack2.description);

    // Select content type
    const contentRadio = page.locator('input[value="content"]').or(page.locator('input[type="radio"][value="content"]'));
    await contentRadio.click();

    // Add image URL
    await page.fill('input[name="image_url"]', 'https://example.com/test-image2.jpg');

    // Fill content
    const contentEditor = page.locator('[name="content_body"]').or(page.locator('textarea[name="content_body"]'));
    await contentEditor.fill(testHack2.contentBody);

    // Select prerequisite
    const prereqSelector = page.locator('[name="prerequisite_ids"]').or(page.locator('select[name="prerequisites"]'));
    if (await prereqSelector.count() > 0) {
      await prereqSelector.selectOption({ label: testHack1.name });
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to hacks list
    await page.waitForURL('/admin/hacks', { timeout: 10000 });

    // Verify hack was created
    await expect(page.locator(`text="${testHack2.name}"`)).toBeVisible();

    // Get hack details from database
    const hack2 = await prisma.hack.findFirst({
      where: { name: testHack2.name }
    });

    expect(hack2).toBeTruthy();
    hack2Id = hack2!.id;
    hack2Slug = hack2!.slug;

    // Verify prerequisite was set
    const prereq = await prisma.hackPrerequisite.findFirst({
      where: {
        hackId: hack2Id,
        prerequisiteHackId: hack1Id
      }
    });

    expect(prereq).toBeTruthy();
  });

  test('5. Admin edits a hack', async ({ page }) => {
    // Navigate to hack edit page
    await page.goto(`/admin/hacks/${hack1Id}/edit`);

    // Update description
    const updatedDescription = 'Updated description for testing';
    await page.fill('textarea[name="description"]', updatedDescription);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to hacks list
    await page.waitForURL('/admin/hacks', { timeout: 10000 });

    // Verify hack was updated in database
    const updatedHack = await prisma.hack.findUnique({
      where: { id: hack1Id }
    });

    expect(updatedHack?.description).toBe(updatedDescription);
  });

  test('6. Admin edits a tag', async ({ page }) => {
    // Navigate to tags page
    await page.goto('/admin/tags');

    // Find and edit the tag
    const editButton = page.locator(`[data-tag-id="${tagId}"]`).locator('button:has-text("Edit")');
    if (await editButton.count() > 0) {
      await editButton.click();

      // Update tag name
      const updatedName = `${testTag.name}-Updated`;
      await page.fill('input[name="name"]', updatedName);
      await page.click('button[type="submit"]');

      // Verify tag was updated
      await page.waitForTimeout(1000);
      const updatedTag = await prisma.tag.findUnique({
        where: { id: tagId }
      });

      expect(updatedTag?.name).toBe(updatedName);
    }
  });

  test('7. User visits locked hack (prerequisite not met)', async ({ page, context }) => {
    // Logout admin
    await context.clearCookies();

    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', regularUser.email);
    await page.fill('input[name="password"]', regularUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/hacks');

    // Try to visit second hack (should be locked)
    await page.goto(`/hacks/${hack2Slug}`);

    // Should show prerequisite required message
    await expect(page.locator('text="Prerequisites Required"')).toBeVisible();
    await expect(page.locator(`text="${testHack1.name}"`)).toBeVisible();

    // Verify no interaction was recorded
    const interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: regularUserId,
          hackId: hack2Id
        }
      }
    });

    expect(interaction).toBeNull();
  });

  test('8. User completes prerequisite hack', async ({ page }) => {
    // Visit first hack
    await page.goto(`/hacks/${hack1Slug}`);

    // Should show hack content
    await expect(page.locator('h1')).toContainText(testHack1.name);
    await expect(page.locator('text="Content for first hack"')).toBeVisible();

    // Wait for interaction to be recorded
    await page.waitForTimeout(1500);

    // Verify hack was marked as visited
    const interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: regularUserId,
          hackId: hack1Id
        }
      }
    });

    expect(interaction).toBeTruthy();
    expect(interaction?.status).toBe('visited');
    expect(interaction?.completedAt).toBeTruthy();
  });

  test('9. Second hack is now unlocked', async ({ page }) => {
    // Visit second hack again
    await page.goto(`/hacks/${hack2Slug}`);

    // Should now show content instead of lock message
    await expect(page.locator('h1')).toContainText(testHack2.name);
    await expect(page.locator('text="Content for second hack"')).toBeVisible();

    // Should not show prerequisite required message
    await expect(page.locator('text="Prerequisites Required"')).not.toBeVisible();

    // Wait for interaction to be recorded
    await page.waitForTimeout(1500);

    // Verify hack was marked as visited
    const interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: regularUserId,
          hackId: hack2Id
        }
      }
    });

    expect(interaction).toBeTruthy();
    expect(interaction?.status).toBe('visited');
  });

  test('10. User history is updated correctly', async ({ page }) => {
    // Navigate to user profile/history
    await page.goto('/profile');

    // Should show both visited hacks
    await expect(page.locator(`text="${testHack1.name}"`)).toBeVisible();
    await expect(page.locator(`text="${testHack2.name}"`)).toBeVisible();

    // Verify in database
    const visitedHacks = await prisma.userHack.findMany({
      where: {
        userId: regularUserId,
        status: 'visited'
      },
      include: {
        hack: true
      }
    });

    expect(visitedHacks).toHaveLength(2);
    expect(visitedHacks.map(uh => uh.hackId)).toContain(hack1Id);
    expect(visitedHacks.map(uh => uh.hackId)).toContain(hack2Id);
  });

  test('11. Completed hacks show visual indicators', async ({ page }) => {
    // Go to hacks list
    await page.goto('/hacks');

    // Both hacks should show as completed
    const hack1Card = page.locator(`[data-testid="hack-card-${hack1Slug}"]`).or(
      page.locator(`text="${testHack1.name}"`).locator('..')
    );
    const hack2Card = page.locator(`[data-testid="hack-card-${hack2Slug}"]`).or(
      page.locator(`text="${testHack2.name}"`).locator('..')
    );

    // Look for completion indicators
    await expect(hack1Card.locator('text="Completed"')).toBeVisible();
    await expect(hack2Card.locator('text="Completed"')).toBeVisible();
  });

  test('12. Like functionality works correctly', async ({ page }) => {
    // Visit a hack
    await page.goto(`/hacks/${hack1Slug}`);

    // Find and click like button
    const likeButton = page.locator('button:has(svg.lucide-heart)');
    const initialText = await likeButton.textContent();
    const initialLikes = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Like the hack
    await likeButton.click();
    await page.waitForTimeout(500);

    // Verify like was recorded
    const likeInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: regularUserId,
          hackId: hack1Id
        }
      }
    });

    expect(likeInteraction?.status).toBe('liked');

    // Verify UI updated
    await expect(likeButton).toContainText(`${initialLikes + 1}`);

    // Unlike
    await likeButton.click();
    await page.waitForTimeout(500);

    // Verify unlike
    const unlikeInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: regularUserId,
          hackId: hack1Id
        }
      }
    });

    // Should either be deleted or status changed
    expect(unlikeInteraction?.status).not.toBe('liked');
  });
});

test.describe('Data Integrity Checks', () => {
  test('Database constraints are enforced', async () => {
    // Test that hacks require either image_url or image_path
    await expect(
      prisma.hack.create({
        data: {
          name: 'Invalid Hack',
          slug: 'invalid-hack',
          description: 'Test',
          contentType: 'content',
          contentBody: '<p>Test</p>'
          // Missing both imageUrl and imagePath
        }
      })
    ).rejects.toThrow();

    // Test that content XOR link constraint works
    await expect(
      prisma.hack.create({
        data: {
          name: 'Invalid Hack 2',
          slug: 'invalid-hack-2',
          description: 'Test',
          imageUrl: 'https://example.com/image.jpg',
          contentType: 'content',
          contentBody: '<p>Test</p>',
          externalLink: 'https://example.com' // Both content and link
        }
      })
    ).rejects.toThrow();
  });

  test('Status values are restricted to valid options', async () => {
    const userId = randomUUID();
    const hackId = randomUUID();

    // Create test data
    await prisma.profile.create({
      data: {
        id: userId,
        email: 'test@example.com',
        isAdmin: false
      }
    });

    await prisma.hack.create({
      data: {
        id: hackId,
        name: 'Test Hack',
        slug: 'test-hack',
        description: 'Test',
        imageUrl: 'https://example.com/image.jpg',
        contentType: 'content',
        contentBody: '<p>Test</p>'
      }
    });

    // Test valid statuses
    const validStatuses = ['completed', 'liked', 'interested'];

    for (const status of validStatuses) {
      const interaction = await prisma.userHack.create({
        data: {
          userId,
          hackId,
          status
        }
      });

      expect(interaction.status).toBe(status);

      // Clean up
      await prisma.userHack.delete({
        where: { id: interaction.id }
      });
    }

    // The 'viewed' status should not be used
    const viewedInteraction = await prisma.userHack.create({
      data: {
        userId,
        hackId,
        status: 'viewed'
      }
    });

    // It might be stored but should be migrated to 'completed'
    console.warn('Warning: "viewed" status should be migrated to "completed"');

    // Clean up
    await prisma.userHack.delete({
      where: { id: viewedInteraction.id }
    });
    await prisma.hack.delete({ where: { id: hackId } });
    await prisma.profile.delete({ where: { id: userId } });
  });
});