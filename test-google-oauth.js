const puppeteer = require('puppeteer');

async function testGoogleOAuth() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable request interception to log all requests
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    console.log('REQUEST:', request.method(), request.url());
    request.continue();
  });
  
  page.on('response', (response) => {
    console.log('RESPONSE:', response.status(), response.url());
  });
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    console.log('2. Taking screenshot of login page...');
    await page.screenshot({ path: 'test-login-page.png' });
    
    console.log('3. Looking for Google sign-in button...');
    const googleButtons = await page.$$('button');
    console.log('Found buttons count:', googleButtons.length);
    
    let googleButton = null;
    for (const button of googleButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Google')) {
        console.log('Found Google button with text:', text);
        googleButton = button;
        break;
      }
    }
    
    if (!googleButton) {
      console.log('Google button not found!');
      return;
    }
    
    console.log('4. Clicking Google sign-in button...');
    await googleButton.click();
    
    console.log('5. Waiting for redirect...');
    await page.waitForTimeout(3000); // Wait 3 seconds instead of navigation
    
    console.log('6. Current URL after click:', page.url());
    await page.screenshot({ path: 'test-after-google-click.png' });
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-error.png' });
  }
  
  await browser.close();
}

testGoogleOAuth().catch(console.error);