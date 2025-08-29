import { test } from '@playwright/test';
import * as lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3003';
const REPORTS_DIR = 'tests/reports/performance';

// Performance budgets (based on industry standards)
const PERFORMANCE_BUDGETS = {
  performance: 85,      // Overall performance score
  accessibility: 90,    // WCAG compliance
  bestPractices: 85,   // Web best practices
  seo: 85,             // SEO optimization
  pwa: 70,             // Progressive Web App features
  
  // Core Web Vitals
  fcp: 1800,           // First Contentful Paint (ms)
  lcp: 2500,           // Largest Contentful Paint (ms)
  tti: 3800,           // Time to Interactive (ms)
  si: 3400,            // Speed Index (ms)
  tbt: 200,            // Total Blocking Time (ms)
  cls: 0.1,            // Cumulative Layout Shift
  
  // Resource budgets
  totalBundleSize: 500 * 1024,     // 500KB total JS
  mainBundleSize: 200 * 1024,      // 200KB main bundle
  imageSize: 1000 * 1024,          // 1MB total images
  fontSize: 100 * 1024,             // 100KB fonts
};

interface LighthouseResult {
  page: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa?: number;
  };
  metrics: {
    fcp: number;
    lcp: number;
    tti: number;
    si: number;
    tbt: number;
    cls: number;
  };
  resources: {
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
    fontSize: number;
  };
  opportunities: any[];
  diagnostics: any[];
  passed: boolean;
  issues: string[];
}

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

async function runLighthouse(url: string, options = {}): Promise<any> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const defaultOptions = {
    logLevel: 'error',
    output: 'json',
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 1638.4,
      uploadThroughputKbps: 675,
    },
    ...options
  };
  
  try {
    const runnerResult = await lighthouse(url, defaultOptions);
    await chrome.kill();
    return runnerResult;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

function analyzeLighthouseResults(result: any, pageName: string): LighthouseResult {
  const lhr = result.lhr;
  const issues: string[] = [];
  
  // Extract scores
  const scores = {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
    pwa: lhr.categories.pwa ? Math.round(lhr.categories.pwa.score * 100) : undefined,
  };
  
  // Extract metrics
  const metrics = {
    fcp: lhr.audits['first-contentful-paint'].numericValue,
    lcp: lhr.audits['largest-contentful-paint'].numericValue,
    tti: lhr.audits['interactive'].numericValue,
    si: lhr.audits['speed-index'].numericValue,
    tbt: lhr.audits['total-blocking-time'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
  };
  
  // Extract resource sizes
  const networkRequests = lhr.audits['network-requests'].details.items;
  const resources = {
    totalSize: networkRequests.reduce((sum: number, req: any) => sum + (req.transferSize || 0), 0),
    jsSize: networkRequests.filter((r: any) => r.resourceType === 'Script')
      .reduce((sum: number, req: any) => sum + (req.transferSize || 0), 0),
    cssSize: networkRequests.filter((r: any) => r.resourceType === 'Stylesheet')
      .reduce((sum: number, req: any) => sum + (req.transferSize || 0), 0),
    imageSize: networkRequests.filter((r: any) => r.resourceType === 'Image')
      .reduce((sum: number, req: any) => sum + (req.transferSize || 0), 0),
    fontSize: networkRequests.filter((r: any) => r.resourceType === 'Font')
      .reduce((sum: number, req: any) => sum + (req.transferSize || 0), 0),
  };
  
  // Extract opportunities
  const opportunities = Object.values(lhr.audits)
    .filter((audit: any) => audit.details?.type === 'opportunity' && audit.numericValue > 0)
    .map((audit: any) => ({
      title: audit.title,
      savings: audit.numericValue,
      description: audit.description,
    }))
    .sort((a: any, b: any) => b.savings - a.savings);
  
  // Extract diagnostics
  const diagnostics = Object.values(lhr.audits)
    .filter((audit: any) => audit.score === 0 && audit.details?.type === 'table')
    .map((audit: any) => ({
      title: audit.title,
      description: audit.description,
    }));
  
  // Check against budgets
  if (scores.performance < PERFORMANCE_BUDGETS.performance) {
    issues.push(`Performance score (${scores.performance}) below target (${PERFORMANCE_BUDGETS.performance})`);
  }
  if (scores.accessibility < PERFORMANCE_BUDGETS.accessibility) {
    issues.push(`Accessibility score (${scores.accessibility}) below target (${PERFORMANCE_BUDGETS.accessibility})`);
  }
  if (metrics.lcp > PERFORMANCE_BUDGETS.lcp) {
    issues.push(`LCP (${Math.round(metrics.lcp)}ms) exceeds budget (${PERFORMANCE_BUDGETS.lcp}ms)`);
  }
  if (metrics.cls > PERFORMANCE_BUDGETS.cls) {
    issues.push(`CLS (${metrics.cls.toFixed(3)}) exceeds budget (${PERFORMANCE_BUDGETS.cls})`);
  }
  if (resources.jsSize > PERFORMANCE_BUDGETS.totalBundleSize) {
    issues.push(`JS bundle size (${Math.round(resources.jsSize/1024)}KB) exceeds budget (${Math.round(PERFORMANCE_BUDGETS.totalBundleSize/1024)}KB)`);
  }
  
  return {
    page: pageName,
    scores,
    metrics,
    resources,
    opportunities,
    diagnostics,
    passed: issues.length === 0,
    issues,
  };
}

test.describe('⚡ Performance Testing with Lighthouse', () => {
  const results: LighthouseResult[] = [];
  
  test('📊 Homepage Performance', async () => {
    console.log('Running Lighthouse audit for homepage...');
    const result = await runLighthouse(`${BASE_URL}/`);
    const analysis = analyzeLighthouseResults(result, 'homepage');
    results.push(analysis);
    
    // Save detailed report
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'homepage-lighthouse.json'),
      JSON.stringify(result.lhr, null, 2)
    );
    
    // Save HTML report
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'homepage-lighthouse.html'),
      result.report
    );
    
    console.log(`Homepage Performance Score: ${analysis.scores.performance}/100`);
    console.log(`LCP: ${Math.round(analysis.metrics.lcp)}ms`);
    console.log(`CLS: ${analysis.metrics.cls.toFixed(3)}`);
    
    if (!analysis.passed) {
      console.warn('Performance issues found:', analysis.issues);
    }
  });
  
  test('🔐 Login Page Performance', async () => {
    console.log('Running Lighthouse audit for login page...');
    const result = await runLighthouse(`${BASE_URL}/login`);
    const analysis = analyzeLighthouseResults(result, 'login');
    results.push(analysis);
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'login-lighthouse.json'),
      JSON.stringify(result.lhr, null, 2)
    );
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'login-lighthouse.html'),
      result.report
    );
    
    console.log(`Login Page Performance Score: ${analysis.scores.performance}/100`);
  });
  
  test('📝 Registration Page Performance', async () => {
    console.log('Running Lighthouse audit for registration page...');
    const result = await runLighthouse(`${BASE_URL}/register`);
    const analysis = analyzeLighthouseResults(result, 'register');
    results.push(analysis);
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'register-lighthouse.json'),
      JSON.stringify(result.lhr, null, 2)
    );
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'register-lighthouse.html'),
      result.report
    );
    
    console.log(`Registration Page Performance Score: ${analysis.scores.performance}/100`);
  });
  
  test('📱 Mobile Performance Testing', async () => {
    console.log('Running Lighthouse audit with mobile settings...');
    
    const mobileOptions = {
      emulatedFormFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4 * 0.75, // 3G speeds
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 150,
        downloadThroughputKbps: 1638.4 * 0.75,
        uploadThroughputKbps: 675 * 0.75,
      },
    };
    
    const result = await runLighthouse(`${BASE_URL}/`, mobileOptions);
    const analysis = analyzeLighthouseResults(result, 'homepage-mobile');
    results.push(analysis);
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'mobile-lighthouse.json'),
      JSON.stringify(result.lhr, null, 2)
    );
    
    console.log(`Mobile Performance Score: ${analysis.scores.performance}/100`);
    console.log(`Mobile LCP: ${Math.round(analysis.metrics.lcp)}ms`);
  });
  
  test.afterAll(async () => {
    // Generate summary report
    const summary = {
      timestamp: new Date().toISOString(),
      budgets: PERFORMANCE_BUDGETS,
      results,
      overallPassed: results.every(r => r.passed),
      averageScores: {
        performance: Math.round(results.reduce((sum, r) => sum + r.scores.performance, 0) / results.length),
        accessibility: Math.round(results.reduce((sum, r) => sum + r.scores.accessibility, 0) / results.length),
        bestPractices: Math.round(results.reduce((sum, r) => sum + r.scores.bestPractices, 0) / results.length),
        seo: Math.round(results.reduce((sum, r) => sum + r.scores.seo, 0) / results.length),
      },
      topOpportunities: results
        .flatMap(r => r.opportunities)
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 5),
    };
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'performance-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Generate HTML summary
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .score {
      text-align: center;
      padding: 15px;
      border-radius: 8px;
      background: #f8f9fa;
    }
    .score-value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-label {
      font-size: 14px;
      color: #666;
    }
    .good { color: #0cce6b; }
    .average { color: #ffa400; }
    .poor { color: #ff4e42; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .metric {
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .metric-name {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .metric-value {
      font-size: 20px;
      font-weight: bold;
      margin-top: 5px;
    }
    .page-results {
      border-left: 4px solid #007bff;
      padding-left: 15px;
      margin: 20px 0;
    }
    .issues {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .issue-item {
      margin: 5px 0;
      color: #856404;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>⚡ Performance Test Report</h1>
      <p>Generated: ${summary.timestamp}</p>
      <p>Status: ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}</p>
    </div>
    
    <div class="card">
      <h2>Average Scores</h2>
      <div class="scores">
        <div class="score">
          <div class="score-value ${summary.averageScores.performance >= 90 ? 'good' : summary.averageScores.performance >= 50 ? 'average' : 'poor'}">
            ${summary.averageScores.performance}
          </div>
          <div class="score-label">Performance</div>
        </div>
        <div class="score">
          <div class="score-value ${summary.averageScores.accessibility >= 90 ? 'good' : summary.averageScores.accessibility >= 50 ? 'average' : 'poor'}">
            ${summary.averageScores.accessibility}
          </div>
          <div class="score-label">Accessibility</div>
        </div>
        <div class="score">
          <div class="score-value ${summary.averageScores.bestPractices >= 90 ? 'good' : summary.averageScores.bestPractices >= 50 ? 'average' : 'poor'}">
            ${summary.averageScores.bestPractices}
          </div>
          <div class="score-label">Best Practices</div>
        </div>
        <div class="score">
          <div class="score-value ${summary.averageScores.seo >= 90 ? 'good' : summary.averageScores.seo >= 50 ? 'average' : 'poor'}">
            ${summary.averageScores.seo}
          </div>
          <div class="score-label">SEO</div>
        </div>
      </div>
    </div>
    
    ${results.map(r => `
      <div class="card">
        <h2>${r.page}</h2>
        <div class="page-results">
          <h3>Scores</h3>
          <div class="scores">
            <div class="score">
              <div class="score-value ${r.scores.performance >= 90 ? 'good' : r.scores.performance >= 50 ? 'average' : 'poor'}">
                ${r.scores.performance}
              </div>
              <div class="score-label">Performance</div>
            </div>
            <div class="score">
              <div class="score-value ${r.scores.accessibility >= 90 ? 'good' : r.scores.accessibility >= 50 ? 'average' : 'poor'}">
                ${r.scores.accessibility}
              </div>
              <div class="score-label">Accessibility</div>
            </div>
          </div>
          
          <h3>Core Web Vitals</h3>
          <div class="metrics-grid">
            <div class="metric">
              <div class="metric-name">LCP</div>
              <div class="metric-value ${r.metrics.lcp <= 2500 ? 'good' : r.metrics.lcp <= 4000 ? 'average' : 'poor'}">
                ${(r.metrics.lcp / 1000).toFixed(1)}s
              </div>
            </div>
            <div class="metric">
              <div class="metric-name">CLS</div>
              <div class="metric-value ${r.metrics.cls <= 0.1 ? 'good' : r.metrics.cls <= 0.25 ? 'average' : 'poor'}">
                ${r.metrics.cls.toFixed(3)}
              </div>
            </div>
            <div class="metric">
              <div class="metric-name">TBT</div>
              <div class="metric-value ${r.metrics.tbt <= 200 ? 'good' : r.metrics.tbt <= 600 ? 'average' : 'poor'}">
                ${Math.round(r.metrics.tbt)}ms
              </div>
            </div>
          </div>
          
          ${r.issues.length > 0 ? `
            <div class="issues">
              <h4>Issues Found:</h4>
              ${r.issues.map(issue => `<div class="issue-item">⚠️ ${issue}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
    
    ${summary.topOpportunities.length > 0 ? `
      <div class="card">
        <h2>Top Performance Opportunities</h2>
        <table>
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Potential Savings</th>
            </tr>
          </thead>
          <tbody>
            ${summary.topOpportunities.map(opp => `
              <tr>
                <td>${opp.title}</td>
                <td>${(opp.savings / 1000).toFixed(1)}s</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
    
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'performance-summary.html'),
      html
    );
    
    console.log('\n📊 Performance Testing Complete!');
    console.log(`📄 Report saved to: ${path.join(REPORTS_DIR, 'performance-summary.html')}`);
  });
});