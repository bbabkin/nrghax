import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

interface ComparisonResult {
  flowName: string;
  imageName: string;
  baselineExists: boolean;
  pixelsDifferent: number;
  percentageDifferent: number;
  status: 'passed' | 'failed' | 'new' | 'missing';
  diffPath?: string;
}

interface ComparisonReport {
  timestamp: string;
  totalImages: number;
  passed: number;
  failed: number;
  new: number;
  missing: number;
  results: ComparisonResult[];
}

export class ScreenshotComparison {
  private baselineDir = 'tests/screenshots/baseline';
  private currentDir = 'tests/screenshots/current';
  private diffDir = 'tests/screenshots/diff';
  private threshold = 0.01; // 1% difference threshold
  private pixelMatchOptions = {
    threshold: 0.1,
    includeAA: false,
    alpha: 0.1,
    aaColor: [255, 255, 0],
    diffColor: [255, 0, 0],
    diffColorAlt: [0, 255, 0],
    diffMask: false
  };

  constructor(customThreshold?: number) {
    if (customThreshold) {
      this.threshold = customThreshold;
    }
    
    // Ensure diff directory exists
    if (!fs.existsSync(this.diffDir)) {
      fs.mkdirSync(this.diffDir, { recursive: true });
    }
  }

  /**
   * Compare all screenshots in current directory with baseline
   */
  async compareAll(): Promise<ComparisonReport> {
    const results: ComparisonResult[] = [];
    const flows = this.getFlowDirectories();
    
    for (const flow of flows) {
      const flowResults = await this.compareFlow(flow);
      results.push(...flowResults);
    }
    
    return this.generateReport(results);
  }

  /**
   * Compare screenshots for a specific flow
   */
  async compareFlow(flowName: string): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = [];
    const currentFlowDir = path.join(this.currentDir, flowName);
    const baselineFlowDir = path.join(this.baselineDir, flowName);
    
    if (!fs.existsSync(currentFlowDir)) {
      console.log(`No current screenshots found for flow: ${flowName}`);
      return results;
    }
    
    const currentImages = fs.readdirSync(currentFlowDir).filter(f => f.endsWith('.png'));
    
    for (const imageName of currentImages) {
      const result = await this.compareImage(flowName, imageName);
      results.push(result);
    }
    
    // Check for missing images (in baseline but not in current)
    if (fs.existsSync(baselineFlowDir)) {
      const baselineImages = fs.readdirSync(baselineFlowDir).filter(f => f.endsWith('.png'));
      const missingImages = baselineImages.filter(img => !currentImages.includes(img));
      
      for (const imageName of missingImages) {
        results.push({
          flowName,
          imageName,
          baselineExists: true,
          pixelsDifferent: 0,
          percentageDifferent: 0,
          status: 'missing'
        });
      }
    }
    
    return results;
  }

  /**
   * Compare a single screenshot with its baseline
   */
  async compareImage(flowName: string, imageName: string): Promise<ComparisonResult> {
    const currentPath = path.join(this.currentDir, flowName, imageName);
    const baselinePath = path.join(this.baselineDir, flowName, imageName);
    const diffPath = path.join(this.diffDir, flowName, imageName);
    
    // Ensure diff flow directory exists
    const diffFlowDir = path.join(this.diffDir, flowName);
    if (!fs.existsSync(diffFlowDir)) {
      fs.mkdirSync(diffFlowDir, { recursive: true });
    }
    
    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      return {
        flowName,
        imageName,
        baselineExists: false,
        pixelsDifferent: 0,
        percentageDifferent: 0,
        status: 'new'
      };
    }
    
    try {
      // Load images
      const currentImage = PNG.sync.read(fs.readFileSync(currentPath));
      const baselineImage = PNG.sync.read(fs.readFileSync(baselinePath));
      
      // Check dimensions
      if (currentImage.width !== baselineImage.width || currentImage.height !== baselineImage.height) {
        console.warn(`Image dimensions don't match for ${flowName}/${imageName}`);
        return {
          flowName,
          imageName,
          baselineExists: true,
          pixelsDifferent: -1,
          percentageDifferent: 100,
          status: 'failed',
          diffPath
        };
      }
      
      // Create diff image
      const diff = new PNG({ width: currentImage.width, height: currentImage.height });
      
      // Compare pixels
      const numDiffPixels = pixelmatch(
        baselineImage.data,
        currentImage.data,
        diff.data,
        currentImage.width,
        currentImage.height,
        this.pixelMatchOptions
      );
      
      // Calculate percentage difference
      const totalPixels = currentImage.width * currentImage.height;
      const percentageDifferent = (numDiffPixels / totalPixels) * 100;
      
      // Save diff image if there are differences
      if (numDiffPixels > 0) {
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
      }
      
      // Determine status based on threshold
      const status = percentageDifferent <= this.threshold * 100 ? 'passed' : 'failed';
      
      return {
        flowName,
        imageName,
        baselineExists: true,
        pixelsDifferent: numDiffPixels,
        percentageDifferent,
        status,
        diffPath: numDiffPixels > 0 ? diffPath : undefined
      };
    } catch (error) {
      console.error(`Error comparing ${flowName}/${imageName}:`, error);
      return {
        flowName,
        imageName,
        baselineExists: true,
        pixelsDifferent: -1,
        percentageDifferent: -1,
        status: 'failed'
      };
    }
  }

  /**
   * Update baseline screenshots with current ones
   */
  async updateBaseline(flowName?: string, imageName?: string): Promise<void> {
    if (imageName && flowName) {
      // Update specific image
      const currentPath = path.join(this.currentDir, flowName, imageName);
      const baselinePath = path.join(this.baselineDir, flowName, imageName);
      
      const baselineFlowDir = path.join(this.baselineDir, flowName);
      if (!fs.existsSync(baselineFlowDir)) {
        fs.mkdirSync(baselineFlowDir, { recursive: true });
      }
      
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`Updated baseline: ${flowName}/${imageName}`);
    } else if (flowName) {
      // Update entire flow
      const currentFlowDir = path.join(this.currentDir, flowName);
      const baselineFlowDir = path.join(this.baselineDir, flowName);
      
      if (!fs.existsSync(baselineFlowDir)) {
        fs.mkdirSync(baselineFlowDir, { recursive: true });
      }
      
      const images = fs.readdirSync(currentFlowDir).filter(f => f.endsWith('.png'));
      for (const img of images) {
        fs.copyFileSync(
          path.join(currentFlowDir, img),
          path.join(baselineFlowDir, img)
        );
      }
      console.log(`Updated all baselines for flow: ${flowName}`);
    } else {
      // Update all baselines
      const flows = this.getFlowDirectories();
      for (const flow of flows) {
        await this.updateBaseline(flow);
      }
      console.log('Updated all baseline screenshots');
    }
  }

  /**
   * Get list of flow directories
   */
  private getFlowDirectories(): string[] {
    if (!fs.existsSync(this.currentDir)) {
      return [];
    }
    
    return fs.readdirSync(this.currentDir)
      .filter(f => fs.statSync(path.join(this.currentDir, f)).isDirectory());
  }

  /**
   * Generate comparison report
   */
  private generateReport(results: ComparisonResult[]): ComparisonReport {
    const report: ComparisonReport = {
      timestamp: new Date().toISOString(),
      totalImages: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      new: results.filter(r => r.status === 'new').length,
      missing: results.filter(r => r.status === 'missing').length,
      results
    };
    
    // Save report
    const reportPath = 'tests/reports/visual-comparison-report.json';
    if (!fs.existsSync('tests/reports')) {
      fs.mkdirSync('tests/reports', { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    this.generateHTMLReport(report);
    
    return report;
  }

  /**
   * Generate HTML report for easy viewing
   */
  private generateHTMLReport(report: ComparisonReport): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Test Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
    .stat {
      flex: 1;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat.passed { background: #d4edda; color: #155724; }
    .stat.failed { background: #f8d7da; color: #721c24; }
    .stat.new { background: #d1ecf1; color: #0c5460; }
    .stat.missing { background: #fff3cd; color: #856404; }
    .results {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .result-item {
      border-bottom: 1px solid #eee;
      padding: 15px 0;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .result-item:last-child { border-bottom: none; }
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-badge.passed { background: #28a745; color: white; }
    .status-badge.failed { background: #dc3545; color: white; }
    .status-badge.new { background: #17a2b8; color: white; }
    .status-badge.missing { background: #ffc107; color: #333; }
    .image-name { flex: 1; }
    .percentage { font-family: monospace; }
    .diff-link { color: #007bff; text-decoration: none; }
    .diff-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📸 Visual Test Report</h1>
    <p>Generated: ${report.timestamp}</p>
    <div class="summary">
      <div class="stat passed">
        <h2>${report.passed}</h2>
        <p>Passed</p>
      </div>
      <div class="stat failed">
        <h2>${report.failed}</h2>
        <p>Failed</p>
      </div>
      <div class="stat new">
        <h2>${report.new}</h2>
        <p>New</p>
      </div>
      <div class="stat missing">
        <h2>${report.missing}</h2>
        <p>Missing</p>
      </div>
    </div>
  </div>
  
  <div class="results">
    <h2>Detailed Results</h2>
    ${report.results.map(r => `
      <div class="result-item">
        <span class="status-badge ${r.status}">${r.status}</span>
        <span class="image-name">${r.flowName}/${r.imageName}</span>
        ${r.percentageDifferent >= 0 ? `<span class="percentage">${r.percentageDifferent.toFixed(2)}%</span>` : ''}
        ${r.diffPath ? `<a href="../../${r.diffPath}" class="diff-link">View Diff</a>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
    
    fs.writeFileSync('tests/reports/visual-test-report.html', html);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const comparison = new ScreenshotComparison();
  
  async function run() {
    switch (command) {
      case 'compare':
        const report = await comparison.compareAll();
        console.log(`\n📊 Visual Test Results:`);
        console.log(`   ✅ Passed: ${report.passed}`);
        console.log(`   ❌ Failed: ${report.failed}`);
        console.log(`   🆕 New: ${report.new}`);
        console.log(`   ⚠️  Missing: ${report.missing}`);
        console.log(`\n📄 Report saved to: tests/reports/visual-test-report.html`);
        break;
        
      case 'update-baseline':
        await comparison.updateBaseline(args[1], args[2]);
        console.log('✅ Baseline updated');
        break;
        
      default:
        console.log('Usage:');
        console.log('  npm run visual:compare         - Compare current screenshots with baseline');
        console.log('  npm run visual:update-baseline  - Update all baselines');
        console.log('  npm run visual:update-baseline [flow] - Update baseline for specific flow');
        console.log('  npm run visual:update-baseline [flow] [image] - Update specific baseline image');
    }
  }
  
  run().catch(console.error);
}