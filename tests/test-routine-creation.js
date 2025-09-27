const puppeteer = require('puppeteer');

async function testRoutineCreation() {
  console.log('🧪 Testing Routine Creation Flow\n');
  console.log('=' .repeat(50));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // 1. Login first
    console.log('\n1️⃣ Logging in as user@nrghax.com...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'screenshots/20-login-page.png' });

    await page.type('input[type="email"]', 'user@nrghax.com');
    await page.type('input[type="password"]', 'User123!@#');
    await page.screenshot({ path: 'screenshots/21-login-filled.png' });

    // Click sign in button
    const signInButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await signInButton.click();
    await new Promise(r => setTimeout(r, 3000));

    const afterLoginUrl = page.url();
    console.log(`   After login URL: ${afterLoginUrl}`);
    await page.screenshot({ path: 'screenshots/22-after-login.png' });

    // 2. Navigate to create routine page
    console.log('\n2️⃣ Navigating to create routine page...');
    await page.goto('http://localhost:3000/routines/new', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const newRoutineUrl = page.url();
    console.log(`   Current URL: ${newRoutineUrl}`);
    await page.screenshot({ path: 'screenshots/23-new-routine-page.png' });

    // Check if we're on the right page
    const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => 'No h1 found');
    console.log(`   Page heading: ${pageTitle}`);

    // 3. Fill out the routine form
    console.log('\n3️⃣ Filling out routine form...');

    // Fill routine name
    const nameInput = await page.$('input[id="name"]');
    if (nameInput) {
      await nameInput.type('Test Routine ' + Date.now());
      console.log('   ✅ Filled routine name');
    } else {
      console.log('   ❌ Could not find name input');
    }

    // Fill description
    const descInput = await page.$('textarea[id="description"]');
    if (descInput) {
      await descInput.type('This is a test routine created by automated test');
      console.log('   ✅ Filled description');
    } else {
      console.log('   ❌ Could not find description input');
    }

    await page.screenshot({ path: 'screenshots/24-form-filled.png' });

    // 4. Try to add a hack
    console.log('\n4️⃣ Adding hacks to routine...');

    // Click "Add Hacks" button
    const addHacksButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Add Hacks'));
    });
    if (addHacksButton && await addHacksButton.evaluate(el => el !== null)) {
      await addHacksButton.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('   ✅ Clicked Add Hacks button');

      // Try to select first hack
      const firstHack = await page.$('button.w-full.text-left');
      if (firstHack) {
        await firstHack.click();
        console.log('   ✅ Selected a hack');
      } else {
        console.log('   ⚠️ No hacks available to select');
      }
    } else {
      console.log('   ❌ Could not find Add Hacks button');
    }

    await page.screenshot({ path: 'screenshots/25-hacks-added.png' });

    // 5. Submit the form
    console.log('\n5️⃣ Submitting the form...');

    // Find and click the Create Routine button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      const buttonText = await page.evaluate(el => el.textContent, submitButton);
      console.log(`   Found submit button: "${buttonText}"`);

      // Click and wait for navigation
      await Promise.all([
        page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
        submitButton.click()
      ]);

      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log('   ❌ Could not find submit button');
    }

    // 6. Check result
    console.log('\n6️⃣ Checking result...');
    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);
    await page.screenshot({ path: 'screenshots/26-after-submit.png' });

    // Check for any error messages
    const errorAlert = await page.$('[role="alert"], .destructive, .error');
    if (errorAlert) {
      const errorText = await page.evaluate(el => el.textContent, errorAlert);
      console.log(`   ❌ Error message found: ${errorText}`);
    } else {
      console.log('   No error messages visible');
    }

    // Check if we're on a routine page
    if (finalUrl.includes('/routines/') && !finalUrl.includes('/new')) {
      console.log('   ✅ SUCCESS: Redirected to routine page!');
      console.log('   Routine was created successfully!');
    } else if (finalUrl.includes('/routines/new')) {
      console.log('   ❌ ISSUE: Still on create page');
      console.log('   Routine creation may have failed');
    }

    // Get page content for debugging
    const pageContent = await page.$eval('body', el => el.innerText.substring(0, 500));
    console.log('\n📄 Page content preview:');
    console.log(pageContent);

    console.log('\n' + '=' .repeat(50));
    console.log('📸 Screenshots saved in screenshots/ directory');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    const page = (await browser.pages())[0];
    if (page) {
      await page.screenshot({ path: 'screenshots/27-error-state.png' });
    }
  } finally {
    await browser.close();
  }
}

testRoutineCreation().catch(console.error);