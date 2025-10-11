import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFlows() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('📸 Testing homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/01-homepage.png', fullPage: true });
  console.log('✅ Homepage screenshot saved');

  // Test browsing hacks
  console.log('📸 Testing hacks page...');
  await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/02-hacks-page.png', fullPage: true });
  console.log('✅ Hacks page screenshot saved');

  // Test individual hack
  console.log('📸 Testing individual hack...');
  await page.goto('http://localhost:3000/hacks/morning-sunlight', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/03-hack-detail.png', fullPage: true });
  console.log('✅ Hack detail screenshot saved');

  // Test routines page
  console.log('📸 Testing routines page...');
  await page.goto('http://localhost:3000/routines', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/04-routines-page.png', fullPage: true });
  console.log('✅ Routines page screenshot saved');

  // Test individual routine
  console.log('📸 Testing individual routine...');
  await page.goto('http://localhost:3000/routines/morning-energy-routine', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/05-routine-detail.png', fullPage: true });
  console.log('✅ Routine detail screenshot saved');

  // Test signin page
  console.log('📸 Testing signin page...');
  await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/06-signin-page.png', fullPage: true });
  console.log('✅ Signin page screenshot saved');

  // Test admin login
  console.log('🔐 Logging in as admin...');
  await page.waitForSelector('input[name="email"]', { timeout: 5000 });
  await page.type('input[name="email"]', 'admin@example.com');
  await page.type('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
  await page.screenshot({ path: '/tmp/07-after-login.png', fullPage: true });
  console.log('✅ After login screenshot saved');

  // Test dashboard
  console.log('📸 Testing dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/08-dashboard.png', fullPage: true });
  console.log('✅ Dashboard screenshot saved');

  // Test my hacks
  console.log('📸 Testing my hacks...');
  await page.goto('http://localhost:3000/dashboard/my-hacks', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/09-my-hacks.png', fullPage: true });
  console.log('✅ My hacks screenshot saved');

  // Test my routines
  console.log('📸 Testing my routines...');
  await page.goto('http://localhost:3000/dashboard/my-routines', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/10-my-routines.png', fullPage: true });
  console.log('✅ My routines screenshot saved');

  // Test admin panel
  console.log('📸 Testing admin panel...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/11-admin-panel.png', fullPage: true });
  console.log('✅ Admin panel screenshot saved');

  // Test admin hacks management
  console.log('📸 Testing admin hacks...');
  await page.goto('http://localhost:3000/admin/hacks', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/12-admin-hacks.png', fullPage: true });
  console.log('✅ Admin hacks screenshot saved');

  // Test admin routines management
  console.log('📸 Testing admin routines...');
  await page.goto('http://localhost:3000/admin/routines', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/13-admin-routines.png', fullPage: true });
  console.log('✅ Admin routines screenshot saved');

  console.log('\n✨ All tests completed! Screenshots saved to /tmp/');

  await browser.close();
}

testFlows().catch(console.error);
