#!/usr/bin/env tsx

import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'

const checklistItems = {
  'Authentication': [
    { test: 'Sign up with email/password', priority: 'high' },
    { test: 'Sign in with email/password', priority: 'high' },
    { test: 'Sign out functionality', priority: 'high' },
    { test: 'Password reset flow', priority: 'medium' },
    { test: 'OAuth sign in (Google)', priority: 'medium' },
    { test: 'OAuth sign in (Discord)', priority: 'low' },
    { test: 'Session persistence across page reloads', priority: 'high' },
    { test: 'Protected route access (redirect when not logged in)', priority: 'high' },
  ],

  'Admin Features': [
    { test: 'Access admin dashboard (admin@test.com)', priority: 'high' },
    { test: 'Create new hack with content', priority: 'high' },
    { test: 'Create hack with video link', priority: 'high' },
    { test: 'Edit existing hack', priority: 'high' },
    { test: 'Delete hack', priority: 'medium' },
    { test: 'Upload hack image', priority: 'medium' },
    { test: 'Set hack prerequisites', priority: 'low' },
    { test: 'Manage tags', priority: 'medium' },
    { test: 'View analytics/statistics', priority: 'low' },
  ],

  'Hack Viewing & Interaction': [
    { test: 'Browse all hacks', priority: 'high' },
    { test: 'View individual hack details', priority: 'high' },
    { test: 'Like/unlike a hack', priority: 'high' },
    { test: 'Mark hack as completed', priority: 'high' },
    { test: 'Filter hacks by category', priority: 'medium' },
    { test: 'Filter hacks by difficulty', priority: 'medium' },
    { test: 'Search hacks by name/description', priority: 'medium' },
    { test: 'View hack prerequisites', priority: 'low' },
    { test: 'Share hack (copy link)', priority: 'low' },
  ],

  'Video Player': [
    { test: 'Play YouTube video in hack', priority: 'high' },
    { test: 'Video player controls work', priority: 'high' },
    { test: 'Timestamp comments display at correct time', priority: 'medium' },
    { test: 'Add comment with timestamp', priority: 'medium' },
    { test: 'Full screen mode', priority: 'low' },
    { test: 'Video progress saves', priority: 'low' },
  ],

  'Routines': [
    { test: 'Browse public routines', priority: 'high' },
    { test: 'View routine details', priority: 'high' },
    { test: 'Create new routine', priority: 'high' },
    { test: 'Add hacks to routine', priority: 'high' },
    { test: 'Remove hacks from routine', priority: 'high' },
    { test: 'Reorder hacks in routine (drag & drop)', priority: 'medium' },
    { test: 'Edit routine details', priority: 'medium' },
    { test: 'Delete routine', priority: 'medium' },
    { test: 'Set routine visibility (public/private)', priority: 'medium' },
    { test: 'Copy/fork public routine', priority: 'low' },
    { test: 'Add tags to routine', priority: 'low' },
  ],

  'Routine Execution': [
    { test: 'Start routine session', priority: 'high' },
    { test: 'Navigate between hacks in routine', priority: 'high' },
    { test: 'Mark hack as completed in session', priority: 'high' },
    { test: 'Pause/resume routine session', priority: 'medium' },
    { test: 'Skip hack in routine', priority: 'medium' },
    { test: 'Complete full routine', priority: 'high' },
    { test: 'View routine completion stats', priority: 'medium' },
    { test: 'Exit routine mid-session', priority: 'medium' },
  ],

  'Comments System': [
    { test: 'Add comment to hack', priority: 'high' },
    { test: 'Add comment to routine', priority: 'medium' },
    { test: 'Reply to existing comment', priority: 'medium' },
    { test: 'Edit own comment', priority: 'medium' },
    { test: 'Delete own comment', priority: 'medium' },
    { test: 'Like/unlike comment', priority: 'low' },
    { test: 'View nested comment threads', priority: 'low' },
    { test: 'Add timestamp comment on video', priority: 'medium' },
  ],

  'User Profile & History': [
    { test: 'View own profile', priority: 'high' },
    { test: 'Edit profile information', priority: 'medium' },
    { test: 'Upload profile picture', priority: 'low' },
    { test: 'View completed hacks history', priority: 'high' },
    { test: 'View liked hacks', priority: 'medium' },
    { test: 'View created routines', priority: 'medium' },
    { test: 'View routine session history', priority: 'medium' },
    { test: 'View statistics/progress', priority: 'low' },
  ],

  'Mobile Responsiveness': [
    { test: 'Navigation menu on mobile', priority: 'high' },
    { test: 'Hack cards display correctly', priority: 'high' },
    { test: 'Video player on mobile', priority: 'high' },
    { test: 'Forms on mobile devices', priority: 'high' },
    { test: 'Drag & drop on touch devices', priority: 'medium' },
    { test: 'Comment system on mobile', priority: 'medium' },
    { test: 'Routine execution on mobile', priority: 'high' },
  ],

  'Performance & UX': [
    { test: 'Page load times < 3s', priority: 'high' },
    { test: 'Smooth scrolling', priority: 'medium' },
    { test: 'Loading states display properly', priority: 'high' },
    { test: 'Error messages are clear', priority: 'high' },
    { test: 'Success notifications work', priority: 'medium' },
    { test: 'Form validation messages', priority: 'high' },
    { test: 'Keyboard navigation', priority: 'low' },
    { test: 'Dark mode (if implemented)', priority: 'low' },
  ],

  'Data Persistence': [
    { test: 'Changes save correctly to database', priority: 'high' },
    { test: 'Data persists after logout/login', priority: 'high' },
    { test: 'Optimistic updates work correctly', priority: 'medium' },
    { test: 'Concurrent user updates handled', priority: 'low' },
    { test: 'Offline functionality (if any)', priority: 'low' },
  ],

  'Security': [
    { test: 'Cannot access admin features as regular user', priority: 'high' },
    { test: 'Cannot edit other users content', priority: 'high' },
    { test: 'Private routines not visible to others', priority: 'high' },
    { test: 'SQL injection prevention', priority: 'high' },
    { test: 'XSS prevention in comments', priority: 'high' },
    { test: 'Rate limiting on API calls', priority: 'low' },
  ]
}

function generateHTMLChecklist() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NRGHax Testing Checklist</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    h1 { font-size: 2.5em; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; font-size: 1.1em; }
    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 20px;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
    }
    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
      margin-top: 5px;
    }
    .content { padding: 30px; }
    .section {
      margin-bottom: 30px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }
    .section-header {
      background: #f5f5f5;
      padding: 15px 20px;
      font-weight: 600;
      font-size: 1.2em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    .section-header:hover { background: #ececec; }
    .section-progress {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9em;
    }
    .progress-bar {
      width: 100px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }
    .section-items {
      padding: 10px 20px;
      display: none;
    }
    .section.open .section-items { display: block; }
    .test-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .test-item:last-child { border-bottom: none; }
    .checkbox {
      width: 20px;
      height: 20px;
      margin-right: 15px;
      cursor: pointer;
    }
    .test-name { flex: 1; }
    .priority {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 500;
    }
    .priority-high {
      background: #fee; color: #c00;
    }
    .priority-medium {
      background: #ffeaa7; color: #d68910;
    }
    .priority-low {
      background: #e8f5e9; color: #27ae60;
    }
    .test-users {
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .test-users h2 { margin-bottom: 15px; color: #333; }
    .user-card {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .user-info { flex: 1; }
    .user-role {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      background: #667eea;
      color: white;
    }
    .user-role.admin { background: #f39c12; }
    .copy-btn {
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
    }
    .copy-btn:hover { background: #5a67d8; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 NRGHax Testing Checklist</h1>
      <div class="subtitle">Comprehensive manual testing guide</div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value" id="totalTests">0</div>
          <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="completedTests">0</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="progressPercent">0%</div>
          <div class="stat-label">Progress</div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="test-users">
        <h2>🔑 Test Accounts</h2>
        <div class="user-card">
          <div class="user-info">
            <strong>Admin User</strong><br>
            Email: admin@test.com | Password: Admin123!
          </div>
          <span class="user-role admin">ADMIN</span>
        </div>
        <div class="user-card">
          <div class="user-info">
            <strong>John Doe</strong><br>
            Email: user1@test.com | Password: User123!
          </div>
          <span class="user-role">USER</span>
        </div>
        <div class="user-card">
          <div class="user-info">
            <strong>Jane Smith</strong><br>
            Email: user2@test.com | Password: User123!
          </div>
          <span class="user-role">USER</span>
        </div>
      </div>

      ${Object.entries(checklistItems).map(([section, items]) => `
        <div class="section" data-section="${section}">
          <div class="section-header" onclick="toggleSection(this)">
            <span>${section}</span>
            <div class="section-progress">
              <span class="section-count">0/${items.length}</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
            </div>
          </div>
          <div class="section-items">
            ${items.map((item, index) => `
              <div class="test-item">
                <input type="checkbox" class="checkbox" id="${section}-${index}" onchange="updateProgress()">
                <label for="${section}-${index}" class="test-name">${item.test}</label>
                <span class="priority priority-${item.priority}">${item.priority.toUpperCase()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      Generated on ${new Date().toLocaleDateString()} |
      <a href="http://localhost:3000" target="_blank">Open App</a> |
      <a href="#" onclick="resetProgress()">Reset Progress</a>
    </div>
  </div>

  <script>
    function toggleSection(header) {
      header.parentElement.classList.toggle('open');
    }

    function updateProgress() {
      const allCheckboxes = document.querySelectorAll('.checkbox');
      const checkedBoxes = document.querySelectorAll('.checkbox:checked');

      document.getElementById('totalTests').textContent = allCheckboxes.length;
      document.getElementById('completedTests').textContent = checkedBoxes.length;
      document.getElementById('progressPercent').textContent =
        Math.round((checkedBoxes.length / allCheckboxes.length) * 100) + '%';

      // Update section progress
      document.querySelectorAll('.section').forEach(section => {
        const sectionBoxes = section.querySelectorAll('.checkbox');
        const sectionChecked = section.querySelectorAll('.checkbox:checked');
        const progress = (sectionChecked.length / sectionBoxes.length) * 100;

        section.querySelector('.section-count').textContent =
          sectionChecked.length + '/' + sectionBoxes.length;
        section.querySelector('.progress-fill').style.width = progress + '%';
      });

      // Save to localStorage
      const progress = {};
      allCheckboxes.forEach(box => {
        progress[box.id] = box.checked;
      });
      localStorage.setItem('nrghax-test-progress', JSON.stringify(progress));
    }

    function loadProgress() {
      const saved = localStorage.getItem('nrghax-test-progress');
      if (saved) {
        const progress = JSON.parse(saved);
        Object.entries(progress).forEach(([id, checked]) => {
          const checkbox = document.getElementById(id);
          if (checkbox) checkbox.checked = checked;
        });
      }
      updateProgress();
    }

    function resetProgress() {
      if (confirm('Reset all progress?')) {
        document.querySelectorAll('.checkbox').forEach(box => box.checked = false);
        localStorage.removeItem('nrghax-test-progress');
        updateProgress();
      }
    }

    // Load progress on page load
    loadProgress();

    // Open high priority sections by default
    document.querySelectorAll('.section').forEach((section, index) => {
      if (index < 3) section.classList.add('open');
    });
  </script>
</body>
</html>`

  const outputPath = path.join(process.cwd(), 'test-checklist.html')
  fs.writeFileSync(outputPath, html)
  return outputPath
}

function printConsoleChecklist() {
  console.log(chalk.bold.cyan('\n🚀 NRGHax Browser Testing Checklist\n'))
  console.log(chalk.gray('=' .repeat(60)))

  console.log(chalk.bold.yellow('\n📋 Test Accounts:\n'))
  console.log(chalk.green('  Admin User:'))
  console.log('    Email: admin@test.com')
  console.log('    Password: Admin123!')

  console.log(chalk.green('\n  Regular User 1:'))
  console.log('    Email: user1@test.com')
  console.log('    Password: User123!')

  console.log(chalk.green('\n  Regular User 2:'))
  console.log('    Email: user2@test.com')
  console.log('    Password: User123!')

  console.log(chalk.gray('\n' + '=' .repeat(60)))

  let totalTests = 0
  let highPriorityTests = 0

  Object.entries(checklistItems).forEach(([category, items]) => {
    console.log(chalk.bold.blue(`\n${category}:`))
    items.forEach(item => {
      totalTests++
      if (item.priority === 'high') highPriorityTests++

      const priorityColor =
        item.priority === 'high' ? chalk.red :
        item.priority === 'medium' ? chalk.yellow :
        chalk.green

      console.log(`  ${chalk.gray('□')} ${item.test} ${priorityColor(`[${item.priority}]`)}`)
    })
  })

  console.log(chalk.gray('\n' + '=' .repeat(60)))
  console.log(chalk.bold.cyan('\n📊 Summary:'))
  console.log(`  Total Tests: ${chalk.bold(totalTests)}`)
  console.log(`  High Priority: ${chalk.bold.red(highPriorityTests)}`)
  console.log(`  Categories: ${chalk.bold(Object.keys(checklistItems).length)}`)
}

// Main execution
console.log(chalk.bold.magenta('\n✨ Generating NRGHax Testing Checklist...\n'))

// Generate HTML checklist
const htmlPath = generateHTMLChecklist()
console.log(chalk.green(`✅ HTML Checklist generated: ${chalk.bold(htmlPath)}`))
console.log(chalk.gray(`   Open in browser: ${chalk.cyan(`file://${htmlPath}`)}`))

// Print console version
printConsoleChecklist()

console.log(chalk.bold.green('\n\n🎯 Next Steps:'))
console.log('1. Run: ' + chalk.cyan('npm run seed:test-users') + ' to create test accounts')
console.log('2. Run: ' + chalk.cyan('npm run dev') + ' to start the development server')
console.log('3. Open: ' + chalk.cyan('http://localhost:3000'))
console.log('4. Use the HTML checklist to track your testing progress')
console.log('\n')