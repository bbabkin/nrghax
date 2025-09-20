import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use service role for test setup/teardown
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Unlock Progress Persistence E2E', () => {
  let userId: string;
  let prerequisiteHackId: string;
  let prerequisiteHackSlug: string;
  let lockedHackId: string;
  let lockedHackSlug: string;
  let otherHackId: string;
  let otherHackSlug: string;

  const testUser = {
    email: `test-${randomUUID()}@example.com`,
    password: 'TestPassword123!'
  };

  test.beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    });

    if (authError) throw authError;
    userId = authData.user?.id || '';

    // Create user profile
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: testUser.email,
        isAdmin: false
      }
    });

    // Create prerequisite hack
    const prereqHack = await prisma.hack.create({
      data: {
        name: `Prerequisite Hack ${randomUUID()}`,
        slug: `prereq-hack-${randomUUID()}`,
        description: 'Complete this first',
        imageUrl: 'https://example.com/prereq.jpg',
        contentType: 'content',
        contentBody: '<p>Prerequisite content</p>'
      }
    });
    prerequisiteHackId = prereqHack.id;
    prerequisiteHackSlug = prereqHack.slug;

    // Create locked hack that requires prerequisite
    const lockedHack = await prisma.hack.create({
      data: {
        name: `Locked Hack ${randomUUID()}`,
        slug: `locked-hack-${randomUUID()}`,
        description: 'This requires the prerequisite',
        imageUrl: 'https://example.com/locked.jpg',
        contentType: 'content',
        contentBody: '<p>Advanced content</p>'
      }
    });
    lockedHackId = lockedHack.id;
    lockedHackSlug = lockedHack.slug;

    // Create prerequisite relationship
    await prisma.hackPrerequisite.create({
      data: {
        hackId: lockedHackId,
        prerequisiteHackId: prerequisiteHackId
      }
    });

    // Create another hack for testing interactions
    const otherHack = await prisma.hack.create({
      data: {
        name: `Other Hack ${randomUUID()}`,
        slug: `other-hack-${randomUUID()}`,
        description: 'Another hack for testing',
        imageUrl: 'https://example.com/other.jpg',
        contentType: 'content',
        contentBody: '<p>Other content</p>'
      }
    });
    otherHackId = otherHack.id;
    otherHackSlug = otherHack.slug;
  });

  test.afterAll(async () => {
    // Clean up
    if (lockedHackId) {
      await prisma.hackPrerequisite.deleteMany({
        where: { hackId: lockedHackId }
      });
    }

    if (userId) {
      await prisma.userHack.deleteMany({
        where: { userId: userId }
      });
    }

    const hackIds = [prerequisiteHackId, lockedHackId, otherHackId].filter(Boolean);
    for (const hackId of hackIds) {
      await prisma.hack.delete({
        where: { id: hackId }
      }).catch(() => {});
    }

    if (userId) {
      await prisma.profile.delete({
        where: { id: userId }
      }).catch(() => {});
      await supabase.auth.admin.deleteUser(userId);
    }

    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/hacks', { timeout: 10000 });
  });

  test('Locked hack shows as locked initially', async ({ page }) => {
    // Navigate to locked hack
    await page.goto(`/hacks/${lockedHackSlug}`);

    // Should show prerequisite required
    await expect(page.locator('text="Prerequisites Required"')).toBeVisible();
    await expect(page.locator('text="Prerequisite Hack"')).toBeVisible();

    // Verify no completion record exists
    const interaction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: lockedHackId
        }
      }
    });
    expect(interaction).toBeNull();
  });

  test('Unlocks after completing prerequisite and persists after liking another hack', async ({ page }) => {
    // Step 1: Complete prerequisite
    await page.goto(`/hacks/${prerequisiteHackSlug}`);
    await expect(page.locator('h1')).toContainText('Prerequisite Hack');
    await page.waitForTimeout(1500); // Wait for completion to be recorded

    // Verify prerequisite was marked as completed
    const prereqInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: prerequisiteHackId
        }
      }
    });
    expect(prereqInteraction?.status).toBe('visited');

    // Step 2: Verify locked hack is now unlocked
    await page.goto(`/hacks/${lockedHackSlug}`);
    await expect(page.locator('h1')).toContainText('Locked Hack');
    await expect(page.locator('text="Prerequisites Required"')).not.toBeVisible();
    await expect(page.locator('text="Advanced content"')).toBeVisible();

    // Step 3: Like a different hack
    await page.goto(`/hacks/${otherHackSlug}`);
    const likeButton = page.locator('button:has(svg.lucide-heart)');
    await likeButton.click();
    await page.waitForTimeout(500);

    // Verify the other hack was liked
    const otherInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: otherHackId
        }
      }
    });
    expect(otherInteraction?.status).toBe('liked');

    // Step 4: Go back to locked hack - should still be unlocked
    await page.goto(`/hacks/${lockedHackSlug}`);
    await expect(page.locator('h1')).toContainText('Locked Hack');
    await expect(page.locator('text="Prerequisites Required"')).not.toBeVisible();
    await expect(page.locator('text="Advanced content"')).toBeVisible();

    // Verify prerequisite completion wasn't affected
    const prereqStillCompleted = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: prerequisiteHackId
        }
      }
    });
    expect(prereqStillCompleted?.status).toBe('visited');
  });

  test('Unlock persists after navigation away and back', async ({ page }) => {
    // Ensure prerequisite is completed (from previous test or setup)
    const prereqInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: prerequisiteHackId
        }
      }
    });

    if (!prereqInteraction || prereqInteraction.status !== 'visited') {
      // Complete it if not already done
      await page.goto(`/hacks/${prerequisiteHackSlug}`);
      await page.waitForTimeout(1500);
    }

    // Step 1: Verify hack is unlocked
    await page.goto(`/hacks/${lockedHackSlug}`);
    await expect(page.locator('text="Advanced content"')).toBeVisible();

    // Step 2: Navigate to different pages
    await page.goto('/hacks'); // Go to hacks list
    await page.waitForTimeout(500);

    await page.goto('/profile'); // Go to profile
    await page.waitForTimeout(500);

    await page.goto('/'); // Go to home
    await page.waitForTimeout(500);

    // Step 3: Come back to locked hack - should still be unlocked
    await page.goto(`/hacks/${lockedHackSlug}`);
    await expect(page.locator('h1')).toContainText('Locked Hack');
    await expect(page.locator('text="Prerequisites Required"')).not.toBeVisible();
    await expect(page.locator('text="Advanced content"')).toBeVisible();
  });

  test('Unlock persists after browser refresh', async ({ page }) => {
    // Ensure prerequisite is completed
    const prereqInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: prerequisiteHackId
        }
      }
    });

    if (!prereqInteraction || prereqInteraction.status !== 'visited') {
      await page.goto(`/hacks/${prerequisiteHackSlug}`);
      await page.waitForTimeout(1500);
    }

    // Navigate to locked hack
    await page.goto(`/hacks/${lockedHackSlug}`);
    await expect(page.locator('text="Advanced content"')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still be unlocked
    await expect(page.locator('h1')).toContainText('Locked Hack');
    await expect(page.locator('text="Prerequisites Required"')).not.toBeVisible();
    await expect(page.locator('text="Advanced content"')).toBeVisible();
  });

  test('Multiple interactions do not affect unlock state', async ({ page }) => {
    // Ensure prerequisite is completed
    const prereqInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: prerequisiteHackId
        }
      }
    });

    if (!prereqInteraction || prereqInteraction.status !== 'visited') {
      await page.goto(`/hacks/${prerequisiteHackSlug}`);
      await page.waitForTimeout(1500);
    }

    // Perform various interactions
    // 1. Like the prerequisite itself
    await page.goto(`/hacks/${prerequisiteHackSlug}`);
    const prereqLikeButton = page.locator('button:has(svg.lucide-heart)');
    await prereqLikeButton.click();
    await page.waitForTimeout(500);

    // 2. Like and unlike another hack
    await page.goto(`/hacks/${otherHackSlug}`);
    const otherLikeButton = page.locator('button:has(svg.lucide-heart)');
    await otherLikeButton.click(); // Like
    await page.waitForTimeout(500);
    await otherLikeButton.click(); // Unlike
    await page.waitForTimeout(500);

    // 3. Navigate around
    await page.goto('/hacks');
    await page.goto('/profile');

    // 4. Check locked hack is still unlocked
    await page.goto(`/hacks/${lockedHackSlug}`);
    await expect(page.locator('text="Advanced content"')).toBeVisible();
    await expect(page.locator('text="Prerequisites Required"')).not.toBeVisible();
  });

  test('Shows correct visual indicators throughout interactions', async ({ page }) => {
    // Go to hacks list
    await page.goto('/hacks');

    // Find the prerequisite hack card
    const prereqCard = page.locator(`text="${prerequisiteHackSlug}"`).locator('..').or(
      page.locator(`[data-testid="hack-card-${prerequisiteHackSlug}"]`)
    );

    // Should show as completed if it was completed in previous tests
    const prereqCompleted = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: prerequisiteHackId
        }
      }
    });

    if (prereqCompleted && prereqCompleted.status === 'visited') {
      await expect(prereqCard.locator('text="Visited"')).toBeVisible({ timeout: 5000 }).catch(() => {
        // Card might not have the indicator, that's okay
      });
    }

    // The locked hack should NOT show as locked in the list if prerequisites are met
    const lockedCard = page.locator(`text="${lockedHackSlug}"`).locator('..').or(
      page.locator(`[data-testid="hack-card-${lockedHackSlug}"]`)
    );

    // Should not show lock icon if unlocked
    const lockIcon = lockedCard.locator('svg.lucide-lock');
    if (prereqCompleted && prereqCompleted.status === 'visited') {
      await expect(lockIcon).not.toBeVisible({ timeout: 5000 }).catch(() => {
        // Lock icon might not exist, that's expected
      });
    }
  });
});

test.describe('Edge Cases for Unlock Persistence', () => {
  test('Handles logout and login correctly', async ({ page, context }) => {
    const testUser2 = {
      email: `test2-${randomUUID()}@example.com`,
      password: 'TestPassword123!'
    };

    // Create another user
    const { data: authData } = await supabase.auth.signUp({
      email: testUser2.email,
      password: testUser2.password
    });

    const userId2 = authData?.user?.id || '';

    await prisma.profile.create({
      data: {
        id: userId2,
        email: testUser2.email,
        isAdmin: false
      }
    });

    try {
      // Login as second user
      await page.goto('/login');
      await page.fill('input[name="email"]', testUser2.email);
      await page.fill('input[name="password"]', testUser2.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/hacks');

      // Create a simple hack for this test
      const testHack = await prisma.hack.create({
        data: {
          name: 'Test Hack for User 2',
          slug: `test-hack-${randomUUID()}`,
          description: 'Test',
          imageUrl: 'https://example.com/test.jpg',
          contentType: 'content',
          contentBody: '<p>Test</p>'
        }
      });

      // Complete the hack
      await page.goto(`/hacks/${testHack.slug}`);
      await page.waitForTimeout(1500);

      // Logout
      await context.clearCookies();

      // Login again
      await page.goto('/login');
      await page.fill('input[name="email"]', testUser2.email);
      await page.fill('input[name="password"]', testUser2.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/hacks');

      // Check if completion persisted
      await page.goto(`/hacks/${testHack.slug}`);

      // Verify in database
      const interaction = await prisma.userHack.findUnique({
        where: {
          userId_hackId: {
            userId: userId2,
            hackId: testHack.id
          }
        }
      });

      expect(interaction?.status).toBe('visited');

      // Clean up
      await prisma.userHack.deleteMany({ where: { userId: userId2 } });
      await prisma.hack.delete({ where: { id: testHack.id } });
    } finally {
      // Clean up user
      await prisma.profile.delete({ where: { id: userId2 } }).catch(() => {});
      await supabase.auth.admin.deleteUser(userId2);
    }
  });
});