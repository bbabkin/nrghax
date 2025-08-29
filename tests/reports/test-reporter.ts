import * as fs from 'fs';
import * as path from 'path';

interface TestReport {
  timestamp: string;
  environment: {
    url: string;
    browser: string;
    viewport: string;
    node: string;
  };
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  visual: {
    screenshotsGenerated: number;
    comparisonResults?: any;
    flows: string[];
  };
  performance: {
    averageScores: any;
    coreWebVitals: any;
    budgetViolations: string[];
  };
  accessibility: {
    violations: number;
    passes: number;
    wcagLevel: string;
    criticalIssues: any[];
  };
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  failures: {
    test: string;
    error: string;
    screenshot?: string;
  }[];
  recommendations: string[];
}

export class EnhancedTestReporter {
  private reportsDir = 'tests/reports';
  private currentReport: Partial<TestReport>;
  
  constructor() {
    this.currentReport = {
      timestamp: new Date().toISOString(),
      environment: {
        url: process.env.TEST_URL || 'http://localhost:3003',
        browser: 'Chromium',
        viewport: '1920x1080',
        node: process.version,
      },
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      visual: {
        screenshotsGenerated: 0,
        flows: [],
      },
      performance: {
        averageScores: {},
        coreWebVitals: {},
        budgetViolations: [],
      },
      accessibility: {
        violations: 0,
        passes: 0,
        wcagLevel: 'AA',
        criticalIssues: [],
      },
      failures: [],
      recommendations: [],
    };
    
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }
  
  /**
   * Add visual test results
   */
  addVisualResults(results: any): void {
    if (results.screenshotsGenerated) {
      this.currentReport.visual!.screenshotsGenerated = results.screenshotsGenerated;
    }
    if (results.flows) {
      this.currentReport.visual!.flows = results.flows;
    }
    if (results.comparisonResults) {
      this.currentReport.visual!.comparisonResults = results.comparisonResults;
    }
  }
  
  /**
   * Add performance test results
   */
  addPerformanceResults(results: any): void {
    if (results.averageScores) {
      this.currentReport.performance!.averageScores = results.averageScores;
    }
    if (results.coreWebVitals) {
      this.currentReport.performance!.coreWebVitals = results.coreWebVitals;
    }
    if (results.budgetViolations) {
      this.currentReport.performance!.budgetViolations = results.budgetViolations;
    }
  }
  
  /**
   * Add accessibility test results
   */
  addAccessibilityResults(results: any): void {
    this.currentReport.accessibility!.violations = results.violations || 0;
    this.currentReport.accessibility!.passes = results.passes || 0;
    if (results.criticalIssues) {
      this.currentReport.accessibility!.criticalIssues = results.criticalIssues;
    }
  }
  
  /**
   * Add test coverage results
   */
  addCoverageResults(coverage: any): void {
    this.currentReport.coverage = {
      lines: coverage.lines || 0,
      statements: coverage.statements || 0,
      functions: coverage.functions || 0,
      branches: coverage.branches || 0,
    };
  }
  
  /**
   * Add test failure
   */
  addFailure(test: string, error: string, screenshot?: string): void {
    this.currentReport.failures!.push({
      test,
      error,
      screenshot,
    });
    this.currentReport.summary!.failed++;
  }
  
  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (this.currentReport.performance?.averageScores?.performance < 90) {
      recommendations.push('🎯 Optimize JavaScript bundle size and reduce main thread work');
    }
    if (this.currentReport.performance?.coreWebVitals?.lcp > 2500) {
      recommendations.push('⚡ Improve Largest Contentful Paint by optimizing images and server response time');
    }
    if (this.currentReport.performance?.coreWebVitals?.cls > 0.1) {
      recommendations.push('📐 Fix layout shifts by setting explicit dimensions for images and dynamic content');
    }
    
    // Accessibility recommendations
    if (this.currentReport.accessibility?.violations > 0) {
      recommendations.push('♿ Address accessibility violations to ensure WCAG compliance');
    }
    
    // Visual testing recommendations
    if (this.currentReport.visual?.comparisonResults?.failed > 0) {
      recommendations.push('🖼️ Review visual regression failures and update baselines if changes are intentional');
    }
    
    // Coverage recommendations
    if (this.currentReport.coverage && this.currentReport.coverage.lines < 80) {
      recommendations.push('📊 Increase test coverage to meet 80% minimum threshold');
    }
    
    // General recommendations
    if (this.currentReport.failures && this.currentReport.failures.length > 0) {
      recommendations.push('🔧 Fix failing tests before deployment');
    }
    
    return recommendations;
  }
  
  /**
   * Generate final report
   */
  async generateReport(): Promise<void> {
    // Add recommendations
    this.currentReport.recommendations = this.generateRecommendations();
    
    // Save JSON report
    const jsonPath = path.join(this.reportsDir, 'comprehensive-test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.currentReport, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    // Update TESTING_SUMMARY_REPORT.md
    await this.updateTestingSummaryReport();
    
    console.log(`\n📊 Comprehensive test report generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${path.join(this.reportsDir, 'comprehensive-test-report.html')}`);
    console.log(`   Summary: TESTING_SUMMARY_REPORT.md updated`);
  }
  
  /**
   * Generate HTML report
   */
  private async generateHTMLReport(): Promise<void> {
    const report = this.currentReport as TestReport;
    const passRate = report.summary.totalTests > 0 
      ? ((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)
      : '0';
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprehensive Test Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      background: white;
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .summary-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 15px;
      text-align: center;
    }
    .summary-card.passed {
      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
    }
    .summary-card.failed {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
    .summary-value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .summary-label {
      font-size: 14px;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .section {
      background: white;
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .metric-value.good { color: #28a745; }
    .metric-value.warning { color: #ffc107; }
    .metric-value.error { color: #dc3545; }
    .flow-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    .flow-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
    }
    .recommendations {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
    }
    .recommendation-item {
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.3);
    }
    .recommendation-item:last-child {
      border-bottom: none;
    }
    .failures {
      margin-top: 20px;
    }
    .failure-item {
      background: #fff5f5;
      border: 1px solid #ffdddd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
    }
    .failure-test {
      font-weight: bold;
      color: #dc3545;
      margin-bottom: 5px;
    }
    .failure-error {
      font-family: monospace;
      font-size: 12px;
      color: #666;
      white-space: pre-wrap;
    }
    .progress-bar {
      width: 100%;
      height: 30px;
      background: #f0f0f0;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 1s ease;
    }
    .progress-fill.warning {
      background: linear-gradient(90deg, #ffc107 0%, #ff9800 100%);
    }
    .progress-fill.error {
      background: linear-gradient(90deg, #dc3545 0%, #c82333 100%);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Comprehensive Test Report</h1>
      <div class="meta">
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Environment: ${report.environment.url} | ${report.environment.browser} | ${report.environment.viewport}</p>
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill ${parseFloat(passRate) >= 90 ? '' : parseFloat(passRate) >= 70 ? 'warning' : 'error'}" 
             style="width: ${passRate}%">
          ${passRate}% Pass Rate
        </div>
      </div>
      
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Tests</div>
          <div class="summary-value">${report.summary.totalTests}</div>
        </div>
        <div class="summary-card passed">
          <div class="summary-label">Passed</div>
          <div class="summary-value">${report.summary.passed}</div>
        </div>
        <div class="summary-card failed">
          <div class="summary-label">Failed</div>
          <div class="summary-value">${report.summary.failed}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Duration</div>
          <div class="summary-value">${(report.summary.duration / 1000).toFixed(1)}s</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>📸 Visual Testing</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Screenshots Generated</div>
          <div class="metric-value">${report.visual.screenshotsGenerated}</div>
        </div>
        ${report.visual.comparisonResults ? `
        <div class="metric-card">
          <div class="metric-label">Visual Comparisons</div>
          <div class="metric-value ${report.visual.comparisonResults.failed > 0 ? 'error' : 'good'}">
            ${report.visual.comparisonResults.passed || 0} / ${report.visual.comparisonResults.total || 0}
          </div>
        </div>
        ` : ''}
      </div>
      <div class="flow-list">
        ${report.visual.flows.map(flow => `<span class="flow-badge">${flow}</span>`).join('')}
      </div>
    </div>
    
    <div class="section">
      <h2>⚡ Performance</h2>
      <div class="metrics-grid">
        ${Object.entries(report.performance.averageScores || {}).map(([key, value]) => `
        <div class="metric-card">
          <div class="metric-label">${key}</div>
          <div class="metric-value ${(value as number) >= 90 ? 'good' : (value as number) >= 50 ? 'warning' : 'error'}">
            ${value}
          </div>
        </div>
        `).join('')}
      </div>
      ${report.performance.budgetViolations.length > 0 ? `
      <div class="recommendations">
        <h3>Performance Issues:</h3>
        ${report.performance.budgetViolations.map(v => `
          <div class="recommendation-item">⚠️ ${v}</div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    
    <div class="section">
      <h2>♿ Accessibility</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Violations</div>
          <div class="metric-value ${report.accessibility.violations === 0 ? 'good' : 'error'}">
            ${report.accessibility.violations}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Passes</div>
          <div class="metric-value good">${report.accessibility.passes}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">WCAG Level</div>
          <div class="metric-value">${report.accessibility.wcagLevel}</div>
        </div>
      </div>
    </div>
    
    ${report.coverage ? `
    <div class="section">
      <h2>📊 Code Coverage</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Lines</div>
          <div class="metric-value ${report.coverage.lines >= 80 ? 'good' : 'warning'}">
            ${report.coverage.lines}%
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Statements</div>
          <div class="metric-value ${report.coverage.statements >= 80 ? 'good' : 'warning'}">
            ${report.coverage.statements}%
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Functions</div>
          <div class="metric-value ${report.coverage.functions >= 80 ? 'good' : 'warning'}">
            ${report.coverage.functions}%
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Branches</div>
          <div class="metric-value ${report.coverage.branches >= 80 ? 'good' : 'warning'}">
            ${report.coverage.branches}%
          </div>
        </div>
      </div>
    </div>
    ` : ''}
    
    ${report.failures.length > 0 ? `
    <div class="section">
      <h2>❌ Test Failures</h2>
      <div class="failures">
        ${report.failures.map(f => `
        <div class="failure-item">
          <div class="failure-test">${f.test}</div>
          <div class="failure-error">${f.error}</div>
          ${f.screenshot ? `<a href="${f.screenshot}">View Screenshot</a>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${report.recommendations.length > 0 ? `
    <div class="section">
      <h2>💡 Recommendations</h2>
      <div class="recommendations">
        ${report.recommendations.map(r => `
          <div class="recommendation-item">${r}</div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
    
    fs.writeFileSync(
      path.join(this.reportsDir, 'comprehensive-test-report.html'),
      html
    );
  }
  
  /**
   * Update TESTING_SUMMARY_REPORT.md
   */
  private async updateTestingSummaryReport(): Promise<void> {
    const report = this.currentReport as TestReport;
    const passRate = report.summary.totalTests > 0 
      ? ((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)
      : '0';
    
    const markdown = `# 🧪 Enhanced Testing Summary Report
*Generated: ${new Date(report.timestamp).toLocaleString()}*

## 📊 Executive Summary

**Overall Pass Rate: ${passRate}%** ${parseFloat(passRate) >= 90 ? '✅' : parseFloat(passRate) >= 70 ? '⚠️' : '❌'}

- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Duration**: ${(report.summary.duration / 1000).toFixed(1)}s

## 📸 Visual Testing Results

- **Screenshots Generated**: ${report.visual.screenshotsGenerated}
- **Flows Tested**: ${report.visual.flows.join(', ')}
${report.visual.comparisonResults ? `- **Visual Regression**: ${report.visual.comparisonResults.passed}/${report.visual.comparisonResults.total} passed` : ''}

### Visual Test Coverage
${report.visual.flows.map(flow => `- ✅ ${flow}`).join('\n')}

## ⚡ Performance Metrics

### Average Scores
${Object.entries(report.performance.averageScores || {}).map(([key, value]) => 
  `- **${key}**: ${value} ${(value as number) >= 90 ? '✅' : (value as number) >= 50 ? '⚠️' : '❌'}`
).join('\n')}

### Core Web Vitals
${report.performance.coreWebVitals ? Object.entries(report.performance.coreWebVitals).map(([key, value]) => 
  `- **${key.toUpperCase()}**: ${value}`
).join('\n') : 'Not measured'}

${report.performance.budgetViolations.length > 0 ? `
### Performance Issues
${report.performance.budgetViolations.map(v => `- ⚠️ ${v}`).join('\n')}
` : ''}

## ♿ Accessibility Report

- **Violations**: ${report.accessibility.violations} ${report.accessibility.violations === 0 ? '✅' : '❌'}
- **Passes**: ${report.accessibility.passes}
- **WCAG Level**: ${report.accessibility.wcagLevel}

${report.accessibility.criticalIssues.length > 0 ? `
### Critical Issues
${report.accessibility.criticalIssues.map(issue => `- ❌ ${issue}`).join('\n')}
` : '✅ No critical accessibility issues found'}

${report.coverage ? `
## 📊 Code Coverage

- **Lines**: ${report.coverage.lines}% ${report.coverage.lines >= 80 ? '✅' : '⚠️'}
- **Statements**: ${report.coverage.statements}% ${report.coverage.statements >= 80 ? '✅' : '⚠️'}
- **Functions**: ${report.coverage.functions}% ${report.coverage.functions >= 80 ? '✅' : '⚠️'}
- **Branches**: ${report.coverage.branches}% ${report.coverage.branches >= 80 ? '✅' : '⚠️'}
` : ''}

${report.failures.length > 0 ? `
## ❌ Test Failures

${report.failures.map(f => `
### ${f.test}
\`\`\`
${f.error}
\`\`\`
${f.screenshot ? `[View Screenshot](${f.screenshot})` : ''}
`).join('\n')}
` : '## ✅ All Tests Passing'}

## 💡 Recommendations

${report.recommendations.length > 0 
  ? report.recommendations.map(r => `- ${r}`).join('\n')
  : '✅ No critical issues found. Application is ready for deployment!'}

## 🔗 Detailed Reports

- [Visual Test Report](tests/reports/visual-test-report.html)
- [Performance Report](tests/reports/performance/performance-summary.html)
- [Accessibility Report](tests/reports/accessibility-results.json)
- [Comprehensive HTML Report](tests/reports/comprehensive-test-report.html)

---
*This report was automatically generated by the Enhanced Testing System*
`;
    
    fs.writeFileSync('TESTING_SUMMARY_REPORT.md', markdown);
  }
}

// Export for use in tests
export default EnhancedTestReporter;