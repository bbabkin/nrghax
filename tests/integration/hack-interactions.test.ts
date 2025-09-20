import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';
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

test.describe('Hack Interaction Tracking', () => {
  let userId: string;
  let testHackId: string;
  let testHackSlug: string;

  test.beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    });

    if (authError) throw authError;
    userId = authData.user?.id || '';

    // Ensure profile exists in Prisma DB
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: testUser.email,
        isAdmin: false
      }
    });

    // Create a test hack
    const hack = await prisma.hack.create({
      data: {
        name: `Test Hack ${randomUUID()}`,
        slug: `test-hack-${randomUUID()}`,
        description: 'Test hack for interaction tracking',
        imageUrl: 'https://example.com/image.jpg',
        contentType: 'content',
        contentBody: '<p>Test content</p>'
      }
    });

    testHackId = hack.id;
    testHackSlug = hack.slug;
  });

  test.afterAll(async () => {
    // Clean up user interactions
    if (userId && testHackId) {
      await prisma.userHack.deleteMany({
        where: {
          userId: userId,
          hackId: testHackId
        }
      });
    }

    // Delete test hack
    if (testHackId) {
      await prisma.hack.delete({
        where: { id: testHackId }
      });
    }

    // Delete test user profile
    if (userId) {
      await prisma.profile.delete({
        where: { id: userId }
      });
      await supabase.auth.admin.deleteUser(userId);
    }

    await prisma.$disconnect();
  });

  test('should mark hack as completed when viewed', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('/hacks', { timeout: 10000 });

    // Navigate to hack using slug
    await page.goto(`/hacks/${testHackSlug}`);

    // Wait for content to load
    await expect(page.locator('h1')).toContainText('Test Hack');

    // Give time for the server action to complete
    await page.waitForTimeout(1000);

    // Check database to verify hack was marked as completed
    const interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: testHackId
        }
      }
    });

    expect(interaction).toBeTruthy();
    expect(interaction?.status).toBe('completed');
    expect(interaction?.completedAt).toBeTruthy();

    // Navigate back to hacks list
    await page.goto('/hacks');

    // Verify the hack shows as completed in the UI
    const hackCard = page.locator(`[data-testid="hack-card-${testHackSlug}"]`);
    await expect(hackCard.locator('text="Completed"')).toBeVisible();
  });

  test('should toggle like status correctly', async ({ page }) => {
    // Ensure we're still logged in from previous test
    await page.goto(`/hacks/${testHackSlug}`);

    // Find and click the like button
    const likeButton = page.locator('button:has(svg.lucide-heart)');
    const initialText = await likeButton.textContent();
    const initialLikes = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Like the hack
    await likeButton.click();
    await page.waitForTimeout(500);

    // Verify database state - should be liked
    let interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: testHackId
        }
      }
    });

    expect(interaction?.status).toBe('liked');

    // Verify UI updated
    await expect(likeButton).toContainText(`${initialLikes + 1}`);

    // Unlike the hack
    await likeButton.click();
    await page.waitForTimeout(500);

    // Verify database state - should be removed or back to completed
    interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: testHackId
        }
      }
    });

    // If interaction exists, it should not be 'liked'
    if (interaction) {
      expect(interaction.status).not.toBe('liked');
    }

    // Verify UI updated back
    await expect(likeButton).toContainText(`${initialLikes}`);
  });

  test('should track completed hacks in user history', async ({ page }) => {
    // Navigate to profile/history page
    await page.goto('/profile');

    // Look for the completed hack in history
    await expect(page.locator(`text="${testHackSlug}"`).or(page.locator(`text="Test Hack"`))).toBeVisible();

    // Verify it shows as completed
    const historyItem = page.locator(`[data-testid="history-item-${testHackId}"]`);
    if (await historyItem.count() > 0) {
      await expect(historyItem.locator('text="Completed"')).toBeVisible();
    }
  });

  test('should not mark hack as viewed for unauthenticated users', async ({ page, context }) => {
    // Clear cookies to simulate logged out state
    await context.clearCookies();

    // Visit hack page as unauthenticated user
    await page.goto(`/hacks/${testHackSlug}`);

    // Wait for content to load
    await expect(page.locator('h1')).toContainText('Test Hack');

    // Give time for any server action that might run
    await page.waitForTimeout(1000);

    // Check database - should not have any new interactions
    const interactions = await prisma.userHack.findMany({
      where: {
        hackId: testHackId
      }
    });

    // Should only have interactions from authenticated test user
    const authenticatedInteractions = interactions.filter(i => i.userId === userId);
    const unauthenticatedInteractions = interactions.filter(i => i.userId !== userId);

    expect(unauthenticatedInteractions).toHaveLength(0);
  });
});

test.describe('Hack Progress Tracking', () => {
  let userId: string;
  let hackIds: string[] = [];

  test.beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `progress-test-${randomUUID()}@example.com`,
      password: 'TestPassword123!'
    });

    if (authError) throw authError;
    userId = authData.user?.id || '';

    // Ensure profile exists
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: authData.user?.email || '',
        isAdmin: false
      }
    });

    // Create multiple test hacks
    for (let i = 0; i < 3; i++) {
      const hack = await prisma.hack.create({
        data: {
          name: `Progress Hack ${i + 1}`,
          slug: `progress-hack-${i + 1}-${randomUUID()}`,
          description: `Test hack ${i + 1}`,
          imageUrl: 'https://example.com/image.jpg',
          contentType: 'content',
          contentBody: `<p>Content ${i + 1}</p>`
        }
      });
      hackIds.push(hack.id);
    }
  });

  test.afterAll(async () => {
    // Clean up
    if (userId) {
      await prisma.userHack.deleteMany({
        where: { userId: userId }
      });

      await prisma.profile.delete({
        where: { id: userId }
      });

      await supabase.auth.admin.deleteUser(userId);
    }

    if (hackIds.length > 0) {
      await prisma.hack.deleteMany({
        where: { id: { in: hackIds } }
      });
    }

    await prisma.$disconnect();
  });

  test('should correctly count completed hacks', async () => {
    // Mark some hacks as completed
    await prisma.userHack.create({
      data: {
        userId: userId,
        hackId: hackIds[0],
        status: 'completed',
        completedAt: new Date()
      }
    });

    await prisma.userHack.create({
      data: {
        userId: userId,
        hackId: hackIds[1],
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Mark one as liked only
    await prisma.userHack.create({
      data: {
        userId: userId,
        hackId: hackIds[2],
        status: 'liked'
      }
    });

    // Count completed hacks
    const completedCount = await prisma.userHack.count({
      where: {
        userId: userId,
        status: 'completed'
      }
    });

    expect(completedCount).toBe(2);

    // Count liked hacks
    const likedCount = await prisma.userHack.count({
      where: {
        userId: userId,
        status: 'liked'
      }
    });

    expect(likedCount).toBe(1);
  });
});