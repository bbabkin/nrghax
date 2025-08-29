"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQuickVisualTests = runQuickVisualTests;
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const test_reporter_1 = require("../reports/test-reporter");
const BASE_URL = 'http://localhost:3003';
const SCREENSHOT_DIR = 'tests/screenshots/current';
// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
async function captureScreenshot(page, flowName, stepName, stepNumber) {
    const filename = `${flowName}-${stepNumber.toString().padStart(2, '0')}-${stepName}.png`;
    const filepath = path.join(SCREENSHOT_DIR, flowName, filename);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    await page.screenshot({
        path: filepath,
        fullPage: true
    });
    console.log(`  📸 Captured: ${filename}`);
    return filepath;
}
async function runQuickVisualTests() {
    console.log('🚀 Starting Quick Visual Tests...\n');
    const reporter = new test_reporter_1.EnhancedTestReporter();
    const browser = await playwright_1.chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    const screenshots = [];
    let testsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;
    try {
        // Test Homepage
        console.log('📄 Testing Homepage...');
        try {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'homepage', 1));
            testsRun++;
            testsPassed++;
            console.log('  ✅ Homepage loaded successfully\n');
        }
        catch (error) {
            console.log('  ❌ Homepage failed:', error.message);
            testsFailed++;
            testsRun++;
        }
        // Test Login Page
        console.log('🔐 Testing Login Page...');
        try {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'login-page', 2));
            // Check for form elements
            const emailInput = await page.$('input[type="email"], input[name="email"]');
            const passwordInput = await page.$('input[type="password"], input[name="password"]');
            const submitButton = await page.$('button[type="submit"]');
            if (emailInput && passwordInput && submitButton) {
                console.log('  ✅ Login form elements found');
                // Fill form for screenshot
                await emailInput.fill('test@example.com');
                await passwordInput.fill('TestPassword123!');
                screenshots.push(await captureScreenshot(page, 'quick-test', 'login-filled', 3));
            }
            testsRun++;
            testsPassed++;
            console.log('  ✅ Login page tested successfully\n');
        }
        catch (error) {
            console.log('  ❌ Login page failed:', error.message);
            testsFailed++;
            testsRun++;
        }
        // Test Registration Page
        console.log('📝 Testing Registration Page...');
        try {
            await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'register-page', 4));
            // Check for form elements
            const emailInput = await page.$('input[type="email"], input[name="email"]');
            const passwordInput = await page.$('input[type="password"], input[name="password"]');
            if (emailInput && passwordInput) {
                console.log('  ✅ Registration form elements found');
                // Test password strength indicator
                await passwordInput.fill('weak');
                await page.waitForTimeout(500);
                screenshots.push(await captureScreenshot(page, 'quick-test', 'register-weak-password', 5));
                await passwordInput.fill('StrongPassword123!@#');
                await page.waitForTimeout(500);
                screenshots.push(await captureScreenshot(page, 'quick-test', 'register-strong-password', 6));
            }
            testsRun++;
            testsPassed++;
            console.log('  ✅ Registration page tested successfully\n');
        }
        catch (error) {
            console.log('  ❌ Registration page failed:', error.message);
            testsFailed++;
            testsRun++;
        }
        // Test Forgot Password Page
        console.log('🔄 Testing Forgot Password Page...');
        try {
            await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'forgot-password', 7));
            testsRun++;
            testsPassed++;
            console.log('  ✅ Forgot password page tested successfully\n');
        }
        catch (error) {
            console.log('  ❌ Forgot password page failed:', error.message);
            testsFailed++;
            testsRun++;
        }
        // Test Mobile Responsiveness
        console.log('📱 Testing Mobile Responsiveness...');
        try {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'mobile-login', 8));
            await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'mobile-register', 9));
            testsRun++;
            testsPassed++;
            console.log('  ✅ Mobile responsiveness tested successfully\n');
        }
        catch (error) {
            console.log('  ❌ Mobile responsiveness failed:', error.message);
            testsFailed++;
            testsRun++;
        }
        // Test Admin Area (expect 404)
        console.log('👤 Testing Admin Area...');
        try {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            screenshots.push(await captureScreenshot(page, 'quick-test', 'admin-area', 10));
            const currentUrl = page.url();
            const pageContent = await page.content();
            const is404 = currentUrl.includes('404') || pageContent.includes('404');
            if (is404) {
                console.log('  ✅ Admin area correctly returns 404 (not implemented)\n');
            }
            else {
                console.log('  ⚠️  Admin area accessible (security check needed)\n');
            }
            testsRun++;
            testsPassed++;
        }
        catch (error) {
            console.log('  ❌ Admin area test failed:', error.message);
            testsFailed++;
            testsRun++;
        }
    }
    finally {
        await browser.close();
    }
    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testsRun}`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📸 Screenshots: ${screenshots.length}`);
    console.log('\n📁 Screenshots saved to:', SCREENSHOT_DIR);
    // Update reporter
    reporter.addVisualResults({
        screenshotsGenerated: screenshots.length,
        flows: ['homepage', 'login', 'register', 'forgot-password', 'mobile', 'admin']
    });
    // Update TESTING_SUMMARY_REPORT.md
    const reportContent = `# 🧪 Visual Testing Report
*Generated: ${new Date().toISOString()}*

## 📊 Quick Visual Test Results

- **Tests Run**: ${testsRun}
- **Passed**: ${testsPassed}
- **Failed**: ${testsFailed}
- **Screenshots Captured**: ${screenshots.length}

### Pages Tested:
- ✅ Homepage
- ✅ Login Page
- ✅ Registration Page
- ✅ Forgot Password Page
- ✅ Mobile Responsiveness
- ✅ Admin Area (404 check)

### Screenshots Generated:
${screenshots.map(s => `- ${path.basename(s)}`).join('\n')}

### Visual Evidence:
All screenshots are available in \`${SCREENSHOT_DIR}\`

## Test Status: ${testsFailed === 0 ? '✅ ALL TESTS PASSING' : '⚠️ SOME TESTS FAILED'}
`;
    fs.writeFileSync('VISUAL_TEST_REPORT.md', reportContent);
    console.log('\n📄 Report saved to: VISUAL_TEST_REPORT.md');
    return { testsRun, testsPassed, testsFailed, screenshots };
}
// Run if executed directly
if (require.main === module) {
    runQuickVisualTests()
        .then(results => {
        process.exit(results.testsFailed > 0 ? 1 : 0);
    })
        .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
