import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runTests() {
  console.log('🧪 Running Visited Badges Integration Tests\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    .then(ctx => ctx.newPage());

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Authentication & Profile Sync
    console.log('📝 Test 1: Authentication & Profile Synchronization');
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[placeholder*="example.com"]', 'test@test.com');
    await page.fill('input[placeholder="Enter your password"]', 'test123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Verify auth worked
    const { data: { user } } = await supabase.auth.getSession();
    if (user) {
      console.log('  ❌ Auth session not found');
      testsFailed++;
    } else {
      // Check if profile exists with correct ID
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'test123'
      });

      const profile = await prisma.profile.findUnique({
        where: { id: authData.user?.id }
      });

      if (profile && profile.email === 'test@test.com') {
        console.log('  ✅ Auth user ID matches Prisma profile ID');
        testsPassed++;
      } else {
        console.log('  ❌ Profile ID mismatch');
        testsFailed++;
      }
    }

    // Test 2: Pre-seeded Visited Badge
    console.log('\n📝 Test 2: Pre-seeded Visited Badge Display');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');

    const reactCardVisited = await page.locator('div:has(h3:has-text("Build Your First React App")) .bg-blue-500:has-text("Visited")').count();

    if (reactCardVisited > 0) {
      console.log('  ✅ Pre-seeded visited badge displays correctly');
      testsPassed++;
    } else {
      console.log('  ❌ Pre-seeded visited badge not showing');
      testsFailed++;

      // Debug: Check database directly
      const userId = authData?.user?.id;
      const userHack = await prisma.userHack.findFirst({
        where: {
          userId: userId,
          hack: { name: 'Build Your First React App' }
        },
        include: { hack: true }
      });
      console.log(`  Debug: DB status = ${userHack?.status || 'not found'}`);
    }

    // Test 3: Visit New Hack
    console.log('\n📝 Test 3: Marking New Hack as Visited');

    const initialBadges = await page.locator('.bg-blue-500:has-text("Visited")').count();
    console.log(`  Initial visited badges: ${initialBadges}`);

    // Visit TypeScript Deep Dive
    await page.click('text="TypeScript Deep Dive"');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if we're on detail page
    const onDetailPage = page.url().includes('/hacks/');
    if (onDetailPage) {
      console.log('  ✅ Navigated to hack detail page');
      testsPassed++;
    } else {
      console.log('  ❌ Failed to navigate to detail page');
      testsFailed++;
    }

    // Go back to hacks list
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const afterBadges = await page.locator('.bg-blue-500:has-text("Visited")').count();
    console.log(`  After visit badges: ${afterBadges}`);

    if (afterBadges > initialBadges) {
      console.log('  ✅ New visited badge appears after visiting hack');
      testsPassed++;
    } else {
      console.log('  ❌ Visited badge not created after visit');
      testsFailed++;
    }

    // Test 4: Prerequisite Locks
    console.log('\n📝 Test 4: Prerequisite Lock System');

    const hasLocks = await page.locator('.lucide-lock').count() > 0;
    if (hasLocks) {
      console.log('  ✅ Prerequisite locks display correctly');
      testsPassed++;
    } else {
      console.log('  ❌ No prerequisite locks found');
      testsFailed++;
    }

    // Test 5: Admin Access
    console.log('\n📝 Test 5: Admin User Access');

    await page.goto('http://localhost:3000/auth/logout');
    await page.waitForTimeout(1000);

    await page.goto('http://localhost:3000/auth');
    await page.fill('input[placeholder*="example.com"]', 'admin@test.com');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    const adminUrl = page.url();
    if (adminUrl.includes('admin')) {
      console.log('  ✅ Admin redirected to admin dashboard');
      testsPassed++;
    } else {
      console.log('  ❌ Admin redirect failed');
      testsFailed++;
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    testsFailed++;
  } finally {
    await browser.close();
    await prisma.$disconnect();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);

    if (testsFailed === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log(`⚠️  ${testsFailed} test(s) failed`);
      process.exit(1);
    }
  }
}

// Run the tests
runTests().catch(console.error);