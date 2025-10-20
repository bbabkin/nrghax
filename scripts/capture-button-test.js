const puppeteer = require('puppeteer');

async function captureButtonTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log('Capturing button test page...');
    await page.goto('http://localhost:3000/test', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: 'test-results/clipped-buttons-demo.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved to test-results/clipped-buttons-demo.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

captureButtonTest();
