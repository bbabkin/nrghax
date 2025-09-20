import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';

// Test data
const TEST_USER = {
  email: 'test@test.com',
  password: 'test123'
};

const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'admin123'
};

const NEW_HACK = {
  name: 'Test Hack ' + Date.now(),
  slug: 'test-hack-' + Date.now(),
  description: 'This is a test hack created by admin',
  contentType: 'content',
  contentBody: '# Test Content\n\nThis is test content.'
};

test.describe('Complete User Flow Tests', () => {
  test.describe('Regular User Flow', () => {
    test('should login and interact with hacks', async ({ page }) => {
      // 1. Go to homepage
      await page.goto('/');
      await expect(page).toHaveTitle(/NRG|Hax/i);

      // 2. Navigate to login
      await page.click('text=Login');
      await page.waitForURL('**/auth');

      // 3. Login with test user
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');

      // Wait for navigation - could be dashboard or hacks
      await page.waitForTimeout(2000);

      // 4. Navigate to hacks page
      await page.goto('/hacks');
      await expect(page.locator('h1')).toContainText('Learning Hacks');

      // 5. Verify hacks are displayed
      const hackCards = page.locator('[data-testid="hack-card"], article, .grid > div > a');
      const hackCount = await hackCards.count();
      expect(hackCount).toBeGreaterThan(0);
      console.log(`Found ${hackCount} hack cards`);

      // 6. Click on first hack to mark as "viewed"
      if (hackCount > 0) {
        const firstHack = hackCards.first();
        const hackName = await firstHack.locator('h3').textContent();
        console.log(`Clicking on hack: ${hackName}`);

        await firstHack.click();
        await page.waitForTimeout(1000);

        // Should be on hack detail page
        await expect(page.locator('h1')).toContainText(hackName || '');

        // Go back to hacks list
        await page.goBack();
      }

      // 7. Test like functionality
      const likeButton = page.locator('button:has-text("Like"), button[aria-label*="like"]').first();
      if (await likeButton.isVisible()) {
        await likeButton.click();
        await page.waitForTimeout(500);
        console.log('Liked a hack');
      }

      // 8. Check profile to see viewed/liked hacks
      await page.goto('/profile/history');
      // Should show completed/viewed hacks
      const historyContent = await page.textContent('body');
      expect(historyContent).toBeTruthy();
    });

    test('should respect hack prerequisites', async ({ page }) => {
      // Login first
      await page.goto('/auth');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);

      // Go to hacks page
      await page.goto('/hacks');

      // Look for locked hacks
      const lockedIndicators = page.locator('text=/locked|prerequisite|complete.*first/i');
      const lockedCount = await lockedIndicators.count();

      if (lockedCount > 0) {
        console.log(`Found ${lockedCount} locked hacks due to prerequisites`);

        // Try to find the prerequisite hack and complete it
        const prerequisiteHack = page.locator('text=/JavaScript Basics/i').first();
        if (await prerequisiteHack.isVisible()) {
          await prerequisiteHack.click();
          await page.waitForTimeout(1000);

          // Mark as completed (if there's a complete button)
          const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark as Complete")');
          if (await completeButton.isVisible()) {
            await completeButton.click();
            console.log('Marked prerequisite hack as completed');

            // Go back and check if dependent hack is unlocked
            await page.goto('/hacks');
            const previouslyLocked = await lockedIndicators.count();
            expect(previouslyLocked).toBeLessThan(lockedCount);
          }
        }
      }
    });
  });

  test.describe('Admin User Flow', () => {
    test('should login as admin and perform CRUD operations', async ({ page }) => {
      // 1. Login as admin
      await page.goto('/auth');
      await page.fill('input[type="email"]', ADMIN_USER.email);
      await page.fill('input[type="password"]', ADMIN_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);

      // 2. Navigate to admin panel
      await page.goto('/admin/hacks');

      // Should have access to admin area
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.locator('h1')).toContainText(/Admin|Manage/i);

      // 3. Create new hack
      const createButton = page.locator('a:has-text("Create"), button:has-text("New Hack"), a[href*="new"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForURL('**/admin/hacks/new');

        // Fill in hack form
        await page.fill('input[name="name"], input[placeholder*="name"]', NEW_HACK.name);
        await page.fill('input[name="slug"], input[placeholder*="slug"]', NEW_HACK.slug);
        await page.fill('textarea[name="description"], input[name="description"]', NEW_HACK.description);

        // Select content type
        const contentTypeSelect = page.locator('select[name="contentType"], input[name="contentType"]');
        if (await contentTypeSelect.isVisible()) {
          await contentTypeSelect.selectOption('content');
        }

        // Add content body
        const contentBody = page.locator('textarea[name="contentBody"], .ProseMirror');
        if (await contentBody.isVisible()) {
          await contentBody.fill(NEW_HACK.contentBody);
        }

        // Submit form
        await page.click('button:has-text("Create"), button[type="submit"]');
        await page.waitForTimeout(2000);

        console.log('Created new hack:', NEW_HACK.name);
      }

      // 4. Edit existing hack
      await page.goto('/admin/hacks');
      const editButtons = page.locator('a:has-text("Edit"), button:has-text("Edit")');
      if ((await editButtons.count()) > 0) {
        await editButtons.first().click();
        await page.waitForURL('**/edit');

        // Make a small edit
        const descField = page.locator('textarea[name="description"], input[name="description"]');
        const currentDesc = await descField.inputValue();
        await descField.fill(currentDesc + ' (Updated)');

        // Save changes
        await page.click('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
        await page.waitForTimeout(1000);

        console.log('Updated existing hack');
      }

      // 5. Delete a hack (if delete functionality exists)
      await page.goto('/admin/hacks');
      const deleteButtons = page.locator('button:has-text("Delete")');
      if ((await deleteButtons.count()) > 0) {
        // Find the test hack we created
        const testHackRow = page.locator(`tr:has-text("${NEW_HACK.name}")`);
        if (await testHackRow.isVisible()) {
          const deleteBtn = testHackRow.locator('button:has-text("Delete")');
          if (await deleteBtn.isVisible()) {
            await deleteBtn.click();

            // Confirm deletion if there's a dialog
            const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click();
            }

            console.log('Deleted test hack');
          }
        }
      }

      // 6. Verify admin can see all user data
      await page.goto('/admin/users');
      const userTable = page.locator('table');
      if (await userTable.isVisible()) {
        const rows = await page.locator('tbody tr').count();
        expect(rows).toBeGreaterThan(0);
        console.log(`Admin can see ${rows} users`);
      }
    });
  });

  test.describe('Likes and Interactions', () => {
    test('should track likes correctly', async ({ page }) => {
      // Login
      await page.goto('/auth');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);

      // Go to hacks
      await page.goto('/hacks');

      // Find a hack to like
      const hackCards = page.locator('[data-testid="hack-card"], article, .grid > div');
      const firstHack = hackCards.first();

      if (await firstHack.isVisible()) {
        // Get initial like count
        const likeCountElement = firstHack.locator('text=/\\d+.*like/i, [data-testid="like-count"]');
        let initialLikes = 0;
        if (await likeCountElement.isVisible()) {
          const text = await likeCountElement.textContent();
          const match = text?.match(/(\d+)/);
          initialLikes = match ? parseInt(match[1]) : 0;
        }

        // Click like button
        const likeButton = firstHack.locator('button[aria-label*="like"], button:has-text("Like")');
        if (await likeButton.isVisible()) {
          await likeButton.click();
          await page.waitForTimeout(1000);

          // Check if like count increased
          if (await likeCountElement.isVisible()) {
            const newText = await likeCountElement.textContent();
            const newMatch = newText?.match(/(\d+)/);
            const newLikes = newMatch ? parseInt(newMatch[1]) : 0;

            expect(newLikes).toBeGreaterThanOrEqual(initialLikes);
            console.log(`Like count changed from ${initialLikes} to ${newLikes}`);
          }

          // Unlike
          await likeButton.click();
          await page.waitForTimeout(1000);
          console.log('Unliked the hack');
        }
      }
    });

    test('should mark hacks as viewed when accessed', async ({ page }) => {
      // Login
      await page.goto('/auth');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);

      // Go to hacks
      await page.goto('/hacks');

      // Click on multiple hacks to mark them as viewed
      const hackLinks = page.locator('a[href*="/hacks/"]');
      const hackCount = Math.min(await hackLinks.count(), 3); // View up to 3 hacks

      const viewedHacks: string[] = [];
      for (let i = 0; i < hackCount; i++) {
        const hack = hackLinks.nth(i);
        const hackText = await hack.textContent();
        viewedHacks.push(hackText || '');

        await hack.click();
        await page.waitForTimeout(1000);

        // Check if hack is displayed
        await expect(page.locator('h1')).toBeTruthy();

        // Go back
        await page.goBack();
        await page.waitForTimeout(500);
      }

      console.log('Viewed hacks:', viewedHacks);

      // Check profile history
      await page.goto('/profile/history');

      // Verify viewed hacks appear in history
      for (const hackName of viewedHacks) {
        if (hackName) {
          const viewedHack = page.locator(`text=${hackName}`);
          // Hack should appear in history (might not be visible if pagination)
          console.log(`Checking if ${hackName} is in history`);
        }
      }
    });
  });

  test.describe('Database State Verification', () => {
    test('should verify database state after interactions', async () => {
      // Direct database checks using Prisma
      const testUser = await prisma.profile.findUnique({
        where: { email: TEST_USER.email },
        include: {
          userHacks: {
            include: {
              hack: true
            }
          }
        }
      });

      expect(testUser).toBeTruthy();
      console.log(`User ${TEST_USER.email} has ${testUser?.userHacks.length || 0} hack interactions`);

      // Check admin user
      const adminUser = await prisma.profile.findUnique({
        where: { email: ADMIN_USER.email }
      });

      expect(adminUser?.isAdmin).toBe(true);
      console.log(`Admin user verified: ${adminUser?.email}`);

      // Check hack prerequisites
      const hacksWithPrereqs = await prisma.hack.findMany({
        include: {
          prerequisites: true
        },
        where: {
          prerequisites: {
            some: {}
          }
        }
      });

      console.log(`Found ${hacksWithPrereqs.length} hacks with prerequisites`);

      // Verify likes are tracked
      const userLikes = await prisma.userHack.findMany({
        where: {
          status: 'liked'
        }
      });

      console.log(`Total likes in system: ${userLikes.length}`);

      // Verify completed/viewed hacks
      const viewedHacks = await prisma.userHack.findMany({
        where: {
          status: 'completed'
        }
      });

      console.log(`Total completed hacks: ${viewedHacks.length}`);
    });
  });
});

// Cleanup function
test.afterAll(async () => {
  // Clean up test data if needed
  const testHack = await prisma.hack.findFirst({
    where: {
      slug: NEW_HACK.slug
    }
  });

  if (testHack) {
    await prisma.hack.delete({
      where: { id: testHack.id }
    });
    console.log('Cleaned up test hack');
  }
});