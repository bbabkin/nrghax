import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Create screenshots directory if it doesn't exist
const screenshotsDir = join(process.cwd(), 'screenshots');
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Admin Page Debug Session Investigation', () => {
  test('capture debug panel information on admin page', async ({ page }) => {
    const BASE_URL = 'https://localhost:3002';
    
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Accept self-signed certificates
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    console.log('Step 1: Navigating to admin page directly...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    
    // Check if we got redirected
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('ISSUE DETECTED: Redirected to login page - session not detected!');
      
      // Take screenshot of login redirect
      await page.screenshot({ 
        path: 'screenshots/01-admin-redirected-to-login.png',
        fullPage: true
      });
      
      // Try to login if we're on the login page
      console.log('Attempting to login with test credentials...');
      
      // Fill in login form
      await page.fill('input[name="email"]', 'bbabkin@gmail.com');
      await page.fill('input[name="password"]', 'test123456');
      
      await page.screenshot({ 
        path: 'screenshots/02-login-form-filled.png',
        fullPage: true
      });
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL(/dashboard|admin/, { timeout: 10000 }).catch(() => {
        console.log('Navigation after login did not complete as expected');
      });
      
      await page.screenshot({ 
        path: 'screenshots/03-after-login.png',
        fullPage: true
      });
      
      // Now try to navigate to admin again
      console.log('Navigating to admin page after login...');
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    }
    
    // Wait for debug panel to be visible
    console.log('Waiting for debug panel to appear...');
    
    try {
      // Wait for the debug panel
      await page.waitForSelector('text=DEBUG PANEL', { timeout: 5000 });
      console.log('Debug panel found!');
      
      // Capture full page screenshot with debug info
      await page.screenshot({ 
        path: 'screenshots/04-admin-page-with-debug-panel.png',
        fullPage: true
      });
      
      // Scroll to ensure all debug info is visible
      await page.evaluate(() => window.scrollTo(0, 0));
      
      // Capture specific sections
      const serverSessionElement = await page.locator('text=Server-Side Session').locator('..');
      if (await serverSessionElement.isVisible()) {
        await serverSessionElement.screenshot({ 
          path: 'screenshots/05-server-side-session.png' 
        });
      }
      
      const clientSessionElement = await page.locator('text=Client-Side Session').locator('..');
      if (await clientSessionElement.isVisible()) {
        await clientSessionElement.screenshot({ 
          path: 'screenshots/06-client-side-session.png' 
        });
      }
      
      const envVarsElement = await page.locator('text=Environment Variables').locator('..');
      if (await envVarsElement.isVisible()) {
        await envVarsElement.screenshot({ 
          path: 'screenshots/07-environment-variables.png' 
        });
      }
      
      const headersElement = await page.locator('text=Request Headers').locator('..');
      if (await headersElement.isVisible()) {
        await headersElement.screenshot({ 
          path: 'screenshots/08-request-headers.png' 
        });
      }
      
      // Extract and log debug information
      const debugInfo = await page.evaluate(() => {
        const serverSession = document.querySelector('h3:has-text("Server-Side Session")')?.parentElement?.textContent;
        const clientSession = document.querySelector('h3:has-text("Client-Side Session")')?.parentElement?.textContent;
        const cookies = document.cookie;
        
        return {
          serverSession,
          clientSession,
          cookies,
          localStorage: JSON.stringify(localStorage)
        };
      });
      
      console.log('\n=== DEBUG INFORMATION EXTRACTED ===');
      console.log('Cookies:', debugInfo.cookies);
      console.log('LocalStorage:', debugInfo.localStorage);
      console.log('=====================================\n');
      
    } catch (error) {
      console.error('Failed to find debug panel:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'screenshots/99-error-no-debug-panel.png',
        fullPage: true
      });
    }
    
    console.log('\nScreenshots saved to ./screenshots/ directory');
    console.log('Review the screenshots to analyze session data discrepancies');
  });
});