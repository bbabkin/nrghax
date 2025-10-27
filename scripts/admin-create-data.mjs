import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureTempImage(tempDir) {
  const outPath = path.join(tempDir, 'sample.png');
  if (fs.existsSync(outPath)) return outPath;
  // 1x1 transparent PNG
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0fRNUAAAAASUVORK5CYII=';
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
  return outPath;
}

async function clickByText(page, selector, text) {
  const matches = await page.$$(selector);
  for (const el of matches) {
    const content = await page.evaluate(node => node.textContent || '', el);
    if (content.trim().includes(text)) {
      await el.click();
      return true;
    }
  }
  return false;
}

async function clickContainsText(page, selector, text) {
  const handle = await page.$x(`//${selector}[contains(normalize-space(.), ${JSON.stringify(text)})]`);
  if (handle && handle.length > 0) {
    await handle[0].click();
    return true;
  }
  return false;
}

async function createTags(page, tags) {
  await page.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle2' });
  const results = [];
  for (const tag of tags) {
    await page.waitForSelector('#tagName', { timeout: 10000 });
    await page.click('#tagName', { clickCount: 3 });
    await page.type('#tagName', tag);
    const respPromise = page.waitForResponse(r => r.url().includes('/api/admin/tags') && r.request().method() === 'POST');
    // Click submit on the Create Tag form
    await page.click('form button[type="submit"]');
    const resp = await respPromise;
    results.push({ tag, status: resp.status() });
    // Small delay for UI to settle
    await sleep(300);
  }
  return results;
}

async function createHack(page, imagePath) {
  await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#name', { timeout: 15000 });
  await page.type('#name', 'Box Breathing');
  await page.type('#description', 'A simple 4-4-4-4 breath technique to quickly reduce stress.');
  // Optional duration
  try {
    await page.type('#duration_minutes', '5');
  } catch {}

  // Ensure content type is "content" (default). If needed, click the radio.
  try {
    const contentRadio = await page.$('#content');
    if (contentRadio) await contentRadio.click();
  } catch {}

  // Fill TipTap editor content
  const editor = await page.$('.ProseMirror');
  if (editor) {
    await editor.click();
    await page.keyboard.type('Step 1: Inhale for 4. Step 2: Hold for 4. Step 3: Exhale for 4. Step 4: Hold for 4.');
  }

  // Upload image
  const fileInput = await page.$('input#image[type="file"]');
  if (!fileInput) throw new Error('Hack image file input not found');
  await fileInput.uploadFile(imagePath);

  // Submit
  // Wait for either navigation to /hacks or for the tag save attempt; primary success path navigates to /hacks
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    clickByText(page, 'button', 'Create Hack'),
  ]);

  // Verify on /hacks
  const url = page.url();
  const onHacks = url.includes('/hacks');
  let hackVisible = false;
  if (onHacks) {
    hackVisible = await page.evaluate(() => {
      return !!Array.from(document.querySelectorAll('*')).find(el => (el.textContent || '').includes('Box Breathing'));
    });
  }
  return { onHacks, hackVisible, currentUrl: url };
}

async function createRoutine(page) {
  await page.goto('http://localhost:3000/dashboard/routines/new', { waitUntil: 'networkidle2' });
  // If redirected to auth, throw early
  if (page.url().includes('/auth')) {
    throw new Error('Not authenticated when opening routines/new');
  }
  await page.waitForSelector('#name', { timeout: 20000 });
  await page.type('#name', 'Morning Focus Routine');
  await page.type('#description', 'A quick routine to prime focus using breath and stillness.');

  // Select first available hack via checkbox list
  const firstHackCheckbox = await page.$('input[name="hackIds"]');
  if (!firstHackCheckbox) throw new Error('No hacks available to add to routine');
  await firstHackCheckbox.click();

  // Make public if toggle visible
  try {
    const publicSwitch = await page.$('#isPublic');
    if (publicSwitch) await publicSwitch.click();
  } catch {}

  // Submit
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    page.click('form button[type="submit"]'),
  ]);

  const url = page.url();
  const onRoutineDetail = url.includes('/routines/');
  let routineVisible = false;
  if (onRoutineDetail) {
    routineVisible = await page.evaluate(() => {
      return !!Array.from(document.querySelectorAll('*')).find(el => (el.textContent || '').toLowerCase().includes('morning focus routine'));
    });
  }
  return { onRoutineDetail, routineVisible, currentUrl: url };
}

async function login(page, email, password) {
  await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="email"], input[placeholder*="email"]', { timeout: 15000 });
  const emailInput = (await page.$('input[type="email"]')) || (await page.$('input[placeholder*="email"]'));
  const pwdInput = await page.$('input[type="password"]');
  if (!emailInput || !pwdInput) throw new Error('Login inputs not found');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(email);
  await pwdInput.click({ clickCount: 3 });
  await pwdInput.type(password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  const url = page.url();
  // If onboarding, skip it
  if (url.includes('/onboarding')) {
    // Try to click the Skip onboarding questions button
    await clickByText(page, 'button', 'Skip onboarding questions');
    await sleep(500);
    // Wait for navigation to dashboard or any page with admin nav
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.waitForSelector('a[href="/admin/users"]', { timeout: 15000 }).catch(() => {}),
    ]);
  }
  // Check admin nav present as validation of logged-in state
  let ok = false;
  try {
    await page.waitForSelector('a[href="/admin/users"]', { timeout: 10000 });
    ok = true;
  } catch {
    // Fallback: check URL-based heuristics
    ok = page.url().includes('/dashboard') || page.url().includes('/');
  }
  return { ok, currentUrl: page.url() };
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const tempDir = path.join(process.cwd(), 'tmp');
  const imagePath = await ensureTempImage(tempDir);

  const results = { login: null, tags: null, hack: null, routine: null };
  try {
    // Login
    results.login = await login(page, 'admin@test.com', 'Admin123!');

    // Create Tags
    results.tags = await createTags(page, ['Focus', 'Sleep', 'Breathwork']);

    // Create Hack
    results.hack = await createHack(page, imagePath);

    // Create Routine
    results.routine = await createRoutine(page);

    console.log(JSON.stringify({ success: true, results }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});


