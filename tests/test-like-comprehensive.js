const puppeteer = require('puppeteer');

/**
 * Comprehensive test for like button functionality
 * Tests both list pages and detail pages to ensure no errors occur
 * This test was created after discovering that previous tests only covered list pages
 */
async function testLikeButtonComprehensive() {
  console.log('\n🧪 COMPREHENSIVE LIKE BUTTON TEST');
  console.log('Testing all pages where like buttons exist');
  console.log('═══════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Track ALL types of errors
  const errorTracking = {
    console: [],
    network: [],
    javascript: []
  };

  // Setup comprehensive error tracking
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errorTracking.console.push(msg.text());
      console.log('  ❌ Console Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    errorTracking.javascript.push(error.message);
    console.log('  ❌ JavaScript Error:', error.message);
  });

  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon')) {
      errorTracking.network.push({
        url: response.url(),
        status: response.status()
      });
      console.log(`  ❌ Network Error: ${response.status()} ${response.url()}`);
    }
  });

  // Test cases covering ALL pages with like buttons
  const testCases = [
    {
      name: 'Hacks List Page',
      url: 'http://localhost:3000/hacks',
      buttonSelector: 'button',
      buttonIdentifier: (btn) => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      }
    },
    {
      name: 'Hack Detail Page',
      url: 'http://localhost:3000/hacks',
      needsNavigation: true,
      navigationSteps: async (page) => {
        // First go to list to find a hack
        await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Find and click on first hack card to go to detail page
        const hackLink = await page.$('a[href^="/hacks/"]');
        if (hackLink) {
          await hackLink.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2' });
          return true;
        }
        return false;
      },
      buttonSelector: 'button',
      buttonIdentifier: (btn) => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      }
    },
    {
      name: 'Routines List Page',
      url: 'http://localhost:3000/routines',
      buttonSelector: 'button',
      buttonIdentifier: (btn) => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      }
    },
    {
      name: 'Routine Detail Page',
      url: 'http://localhost:3000/routines',
      needsNavigation: true,
      navigationSteps: async (page) => {
        // First go to list to find a routine
        await page.goto('http://localhost:3000/routines', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Find and click on first routine card to go to detail page
        const routineLink = await page.$('a[href^="/routines/"]');
        if (routineLink) {
          await routineLink.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2' });
          return true;
        }
        return false;
      },
      buttonSelector: 'button',
      buttonIdentifier: (btn) => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      }
    }
  ];

  const testResults = [];

  for (const testCase of testCases) {
    console.log(`\n📍 Testing: ${testCase.name}`);
    console.log('───────────────────────────────────');

    // Reset error tracking for this test
    errorTracking.console = [];
    errorTracking.network = [];
    errorTracking.javascript = [];

    try {
      // Clear session to ensure unregistered user
      await page.evaluateOnNewDocument(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Navigate to page
      if (testCase.needsNavigation && testCase.navigationSteps) {
        const navSuccess = await testCase.navigationSteps(page);
        if (!navSuccess) {
          console.log(`  ⚠️ Could not navigate to ${testCase.name} - no items found`);
          testResults.push({
            name: testCase.name,
            status: 'skipped',
            reason: 'No items to navigate to'
          });
          continue;
        }
      } else {
        await page.goto(testCase.url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const currentUrl = page.url();
      console.log(`  📄 Current URL: ${currentUrl}`);

      // Find like button
      const likeButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const likeBtn = buttons.find(btn => {
          const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
          const hasSvg = btn.innerHTML.includes('svg');
          const hasNumber = /\d+/.test(btn.textContent);
          return hasFlexClass && hasSvg && hasNumber;
        });
        return likeBtn ? { found: true, text: likeBtn.textContent } : { found: false };
      });

      if (!likeButton.found) {
        console.log(`  ⚠️ No like button found on ${testCase.name}`);
        testResults.push({
          name: testCase.name,
          status: 'skipped',
          reason: 'No like button found'
        });
        continue;
      }

      console.log(`  ✅ Like button found: ${likeButton.text}`);

      // Take screenshot before clicking
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await page.screenshot({
        path: `screenshots/comprehensive-${testCase.name.replace(/\s+/g, '-').toLowerCase()}-before-${timestamp}.png`
      });

      // Click the like button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const likeBtn = buttons.find(btn => {
          const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
          const hasSvg = btn.innerHTML.includes('svg');
          const hasNumber = /\d+/.test(btn.textContent);
          return hasFlexClass && hasSvg && hasNumber;
        });
        if (likeBtn) likeBtn.click();
      });

      console.log('  🖱️ Like button clicked');

      // Wait for any response/redirect
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check where we ended up
      const newUrl = page.url();
      const redirected = newUrl.includes('/auth');

      // Take screenshot after clicking
      await page.screenshot({
        path: `screenshots/comprehensive-${testCase.name.replace(/\s+/g, '-').toLowerCase()}-after-${timestamp}.png`
      });

      // Compile results
      const hasErrors = errorTracking.console.length > 0 ||
                       errorTracking.network.length > 0 ||
                       errorTracking.javascript.length > 0;

      let status = 'unknown';
      let details = {};

      if (redirected && !hasErrors) {
        status = 'success';
        console.log('  ✅ SUCCESS: Redirected to auth page, no errors');
      } else if (redirected && hasErrors) {
        status = 'partial';
        console.log('  ⚠️ PARTIAL: Redirected but errors occurred');
        details.errors = { ...errorTracking };
      } else if (!redirected && hasErrors) {
        status = 'failed';
        console.log('  ❌ FAILED: Errors occurred, no redirect');
        details.errors = { ...errorTracking };
        details.currentUrl = newUrl;
      } else {
        status = 'failed';
        console.log('  ❌ FAILED: No redirect to auth page');
        details.currentUrl = newUrl;
      }

      testResults.push({
        name: testCase.name,
        status,
        redirected,
        hasErrors,
        errorCount: errorTracking.console.length + errorTracking.network.length + errorTracking.javascript.length,
        details
      });

    } catch (error) {
      console.log(`  ❌ TEST ERROR: ${error.message}`);
      testResults.push({
        name: testCase.name,
        status: 'error',
        error: error.message
      });

      await page.screenshot({
        path: `screenshots/comprehensive-error-${testCase.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
      });
    }
  }

  // Final Report
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('═══════════════════════════════════════════════════\n');

  const successCount = testResults.filter(r => r.status === 'success').length;
  const failedCount = testResults.filter(r => r.status === 'failed').length;
  const partialCount = testResults.filter(r => r.status === 'partial').length;
  const skippedCount = testResults.filter(r => r.status === 'skipped').length;

  console.log('Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failedCount}`);
  console.log(`  ⚠️ Partial: ${partialCount}`);
  console.log(`  ⏭️ Skipped: ${skippedCount}`);
  console.log('\nDetailed Results:');
  console.log('─────────────────');

  for (const result of testResults) {
    const icon = result.status === 'success' ? '✅' :
                 result.status === 'failed' ? '❌' :
                 result.status === 'partial' ? '⚠️' :
                 result.status === 'skipped' ? '⏭️' : '❓';

    console.log(`\n${icon} ${result.name}:`);
    console.log(`   Status: ${result.status}`);

    if (result.redirected !== undefined) {
      console.log(`   Redirected: ${result.redirected ? 'Yes' : 'No'}`);
    }

    if (result.hasErrors !== undefined) {
      console.log(`   Has Errors: ${result.hasErrors ? `Yes (${result.errorCount} errors)` : 'No'}`);
    }

    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.details?.errors) {
      if (result.details.errors.console?.length > 0) {
        console.log('   Console Errors:');
        result.details.errors.console.forEach(e => console.log(`     - ${e}`));
      }
      if (result.details.errors.network?.length > 0) {
        console.log('   Network Errors:');
        result.details.errors.network.forEach(e => console.log(`     - ${e.status} ${e.url}`));
      }
      if (result.details.errors.javascript?.length > 0) {
        console.log('   JavaScript Errors:');
        result.details.errors.javascript.forEach(e => console.log(`     - ${e}`));
      }
    }
  }

  // Overall verdict
  console.log('\n═══════════════════════════════════════════════════');
  console.log('OVERALL VERDICT:');
  if (successCount === testResults.length) {
    console.log('✅✅✅ ALL TESTS PASSED! Like button works correctly on all pages.');
  } else if (failedCount === 0 && partialCount === 0) {
    console.log('✅ No failures detected, but some tests were skipped.');
  } else if (failedCount > 0) {
    console.log(`❌ ${failedCount} test(s) failed. Like button has issues that need fixing.`);
  } else {
    console.log(`⚠️ ${partialCount} test(s) had partial success. Some issues may need attention.`);
  }
  console.log('═══════════════════════════════════════════════════\n');

  await browser.close();
}

// Run the comprehensive test
testLikeButtonComprehensive().catch(console.error);