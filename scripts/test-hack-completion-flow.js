const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testHackCompletionFlow() {
  console.log('Starting hack completion flow test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.toString());
    console.error('Page error:', error);
  });

  try {
    console.log('Step 1: Navigate to Foundation level page');
    await page.goto('http://localhost:3000/levels/foundation', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Step 2: Wait for page to fully load');
    // Wait for either the test ID or a reasonable timeout for fast refresh
    let pageLoaded = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!pageLoaded && attempts < maxAttempts) {
      try {
        await page.waitForSelector('[data-testid="level-page"]', { timeout: 5000 });
        pageLoaded = true;
        console.log('Page loaded successfully');
      } catch (e) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts}: Page not ready, waiting for Fast Refresh...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!pageLoaded) {
      throw new Error('Page did not load after multiple attempts');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Step 3: Take initial screenshot');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'test2-01-initial.png'),
      fullPage: true
    });

    console.log('\nStep 4: Find and click "Morning Sunlight Exposure" hack');

    // Find the hack card by title
    const hackCards = await page.$$('[data-testid="hack-card"]');
    console.log(`Found ${hackCards.length} hack cards`);

    let morningSunlightCard = null;
    for (const card of hackCards) {
      const titleElement = await card.$('[data-testid="hack-title"]');
      if (titleElement) {
        const title = await page.evaluate(el => el.textContent, titleElement);
        console.log(`  - Card title: "${title}"`);
        if (title.includes('Morning Sunlight Exposure')) {
          morningSunlightCard = card;
          console.log('  ✓ Found Morning Sunlight Exposure card');
          break;
        }
      }
    }

    if (!morningSunlightCard) {
      throw new Error('Could not find Morning Sunlight Exposure hack card');
    }

    // Click the card
    await morningSunlightCard.click();
    console.log('Clicked on Morning Sunlight Exposure card');

    console.log('\nStep 5: Wait for modal to open');

    // Wait for navigation and modal to open
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if we navigated to the hack modal route
    const currentUrl = page.url();
    console.log(`Current URL after click: ${currentUrl}`);

    if (currentUrl.includes('/hacks/morning-sunlight')) {
      console.log('✓ Navigated to hack modal route');
    } else {
      console.log('⚠ URL did not change as expected');
    }

    // Look for modal content (the modal might not have role="dialog" yet due to Fast Refresh)
    // Let's look for the "Mark Complete" button instead
    const markCompleteVisible = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('mark') && text.includes('complete');
      });
    });

    console.log(`Mark Complete button visible: ${markCompleteVisible ? '✓ YES' : '✗ NO'}`);

    console.log('\nStep 6: Take screenshot of open modal');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'test2-02-modal-open.png'),
      fullPage: true
    });

    console.log('\nStep 7: Find and click "Mark Complete" button');

    // Look for the button with specific text
    const markCompleteButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('mark') && text.includes('complete');
      });
    });

    if (!markCompleteButton.asElement()) {
      throw new Error('Could not find "Mark Complete" button');
    }

    console.log('Found "Mark Complete" button, clicking...');
    await markCompleteButton.asElement().click();
    console.log('Clicked "Mark Complete" button');

    console.log('\nStep 8: Wait for modal to auto-close and page to update');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if modal is gone
    const modalStillOpen = await page.$('[role="dialog"]');
    const modalClosed = !modalStillOpen;
    console.log(`Modal auto-closed: ${modalClosed ? '✓ YES' : '✗ NO'}`);

    console.log('\nStep 9: Take screenshot after completion');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'test2-03-after-complete.png'),
      fullPage: true
    });

    console.log('\nStep 10: Check current URL');
    const finalUrl = page.url();
    const onLevelsPage = finalUrl.includes('/levels/foundation');
    console.log(`Current URL: ${finalUrl}`);
    console.log(`On levels page: ${onLevelsPage ? '✓ YES' : '✗ NO'}`);

    console.log('\nStep 11: Check if "Box Breathing" hack is unlocked');

    // Wait a bit for the page to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find Box Breathing card
    const allHackCards = await page.$$('[data-testid="hack-card"]');
    let boxBreathingCard = null;
    let boxBreathingStatus = null;

    for (const card of allHackCards) {
      const titleElement = await card.$('[data-testid="hack-title"]');
      if (titleElement) {
        const title = await page.evaluate(el => el.textContent, titleElement);
        if (title.includes('Box Breathing')) {
          boxBreathingCard = card;
          console.log('Found Box Breathing card');

          // Check for lock icon
          const lockIcon = await card.$('[data-testid="lock-icon"]');
          const hasLockIcon = !!lockIcon;

          // Check if card is grayed out (check opacity or disabled state)
          const isGrayedOut = await page.evaluate(el => {
            const styles = window.getComputedStyle(el);
            const opacity = parseFloat(styles.opacity);
            const hasDisabledClass = el.classList.contains('opacity-50') ||
                                    el.classList.contains('opacity-60') ||
                                    el.classList.contains('grayscale');
            return opacity < 1 || hasDisabledClass;
          }, card);

          boxBreathingStatus = {
            hasLockIcon,
            isGrayedOut,
            isUnlocked: !hasLockIcon && !isGrayedOut
          };

          console.log(`  Lock icon present: ${hasLockIcon ? '✗ YES (still locked)' : '✓ NO (unlocked)'}`);
          console.log(`  Card grayed out: ${isGrayedOut ? '✗ YES (still locked)' : '✓ NO (unlocked)'}`);
          console.log(`  Overall status: ${boxBreathingStatus.isUnlocked ? '✓ UNLOCKED' : '✗ LOCKED'}`);
          break;
        }
      }
    }

    if (!boxBreathingCard) {
      console.log('⚠ Could not find Box Breathing card');
    }

    console.log('\nStep 12: Take final screenshot of Box Breathing status');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'test2-04-box-breathing-status.png'),
      fullPage: true
    });

    // Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`Modal auto-closed: ${modalClosed ? '✓ YES' : '✗ NO'}`);
    console.log(`Back on levels page: ${onLevelsPage ? '✓ YES' : '✗ NO'}`);
    if (boxBreathingStatus) {
      console.log(`Box Breathing unlocked: ${boxBreathingStatus.isUnlocked ? '✓ YES' : '✗ NO'}`);
      console.log(`  - No lock icon: ${!boxBreathingStatus.hasLockIcon ? '✓' : '✗'}`);
      console.log(`  - Not grayed out: ${!boxBreathingStatus.isGrayedOut ? '✓' : '✗'}`);
    } else {
      console.log('Box Breathing status: ⚠ CARD NOT FOUND');
    }
    console.log(`\nConsole errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Check for relevant console messages
    const relevantMessages = consoleMessages.filter(msg =>
      msg.text.toLowerCase().includes('error') ||
      msg.text.toLowerCase().includes('unlock') ||
      msg.text.toLowerCase().includes('complete') ||
      msg.text.toLowerCase().includes('mutation')
    );

    if (relevantMessages.length > 0) {
      console.log('\nRelevant console messages:');
      relevantMessages.forEach(msg => {
        console.log(`  [${msg.type}] ${msg.text}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('='.repeat(60) + '\n');

    // Keep browser open for 3 seconds to see final state
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);

    // Take error screenshot
    try {
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'test2-error.png'),
        fullPage: true
      });
      console.log('Error screenshot saved');
    } catch (screenshotError) {
      console.error('Could not save error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
testHackCompletionFlow().catch(console.error);
