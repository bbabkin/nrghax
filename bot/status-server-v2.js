const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const execAsync = promisify(exec);
const app = express();
const PORT = 3333;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(express.json());

async function getLogContent(logFile, lines = 50) {
  try {
    const logPath = path.join(__dirname, 'logs', logFile);
    const { stdout } = await execAsync(`tail -n ${lines} "${logPath}"`);
    return stdout;
  } catch (error) {
    return `Error reading ${logFile}: ${error.message}`;
  }
}

async function getBotStatus() {
  try {
    // Check if the bot process is running directly (not using PM2)
    const { stdout: psOutput } = await execAsync('ps aux | grep -E "node.*bot/dist/index.js" | grep -v grep');

    if (psOutput.trim()) {
      const parts = psOutput.trim().split(/\s+/);
      const pid = parts[1];
      const cpu = parts[2];
      const mem = parts[3];

      // Get process uptime
      const { stdout: uptimeOutput } = await execAsync(`ps -o etimes= -p ${pid}`).catch(() => ({ stdout: '0' }));
      const uptimeSeconds = parseInt(uptimeOutput.trim()) || 0;

      // Get memory in MB
      const { stdout: memOutput } = await execAsync(`ps -o rss= -p ${pid}`).catch(() => ({ stdout: '0' }));
      const memoryMB = Math.round(parseInt(memOutput.trim()) / 1024) || 0;

      return {
        status: 'online',
        uptime: uptimeSeconds,
        cpu: parseFloat(cpu) || 0,
        memory: memoryMB,
        restarts: 0,
        pid: pid
      };
    }

    // Try PM2 as fallback
    try {
      const { stdout: pm2Status } = await execAsync('/home/coder/.npm-global/bin/pm2 jlist 2>/dev/null || pm2 jlist 2>/dev/null');
      const processes = JSON.parse(pm2Status);
      const botProcess = processes.find(p => p.name === 'nrghax-bot');

      if (botProcess) {
        return {
          status: botProcess.pm2_env.status,
          uptime: botProcess.pm2_env.pm_uptime ?
            Math.floor((Date.now() - botProcess.pm2_env.pm_uptime) / 1000) : 0,
          cpu: botProcess.monit?.cpu || 0,
          memory: Math.round((botProcess.monit?.memory || 0) / 1024 / 1024),
          restarts: botProcess.pm2_env.restart_time || 0,
          pid: botProcess.pid || 'N/A'
        };
      }
    } catch (pm2Error) {
      // PM2 not available or bot not managed by PM2
    }

    return { status: 'offline', uptime: 0, cpu: 0, memory: 0, restarts: 0, pid: 'N/A' };
  } catch (error) {
    return { status: 'Error', error: error.message };
  }
}

async function getSystemInfo() {
  try {
    const { stdout: uptime } = await execAsync('uptime');
    const { stdout: df } = await execAsync('df -h /');
    const { stdout: memory } = await execAsync('free -h');

    return {
      uptime: uptime.trim(),
      disk: df.split('\n')[1]?.split(/\s+/)[4] || 'N/A',
      memory: memory.split('\n')[1]?.split(/\s+/).slice(1, 4).join(' / ') || 'N/A'
    };
  } catch (error) {
    return { error: error.message };
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

// API Routes for database tests
app.get('/api/test-connection', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hacks').select('count');
    if (error) throw error;
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch-hacks', async (req, res) => {
  try {
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ success: true, hacks, count: hacks?.length || 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch-profiles', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ success: true, profiles, count: profiles?.length || 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/database-stats', async (req, res) => {
  try {
    const { count: hackCount } = await supabase
      .from('hacks')
      .select('*', { count: 'exact', head: true });

    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: userHackCount } = await supabase
      .from('user_hacks')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      stats: {
        hacks: hackCount || 0,
        profiles: profileCount || 0,
        userHacks: userHackCount || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/create-test-hack', async (req, res) => {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const testHack = {
      name: `Test Hack ${timestamp}`,
      slug: `test-hack-${timestamp}-${randomSuffix}`,
      description: 'This is a test hack created from the status page',
      category: 'test',
      content_type: 'content',
      content_body: '<p>Test content for the hack created from status page</p>',
      created_at: new Date().toISOString(),
      created_by: '35f64d58-fcbc-4e8e-9ea0-bd080c57f5f9' // Using the first profile ID from the database
    };

    const { data, error } = await supabase
      .from('hacks')
      .insert(testHack)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, hack: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', async (req, res) => {
  const botStatus = await getBotStatus();
  const systemInfo = await getSystemInfo();
  const errorLog = await getLogContent('error.log', 20);
  const combinedLog = await getLogContent('combined.log', 30);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NRGHax Bot Status</title>
  <meta http-equiv="refresh" content="30">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .status-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .status-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }
    .status-card h3 {
      color: #667eea;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .status-value {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }
    .status-online {
      color: #10b981;
    }
    .status-offline {
      color: #ef4444;
    }
    .log-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .log-section h2 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .log-content {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
      border-radius: 8px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .error-log {
      color: #ff6b6b;
    }
    .refresh-note {
      text-align: center;
      color: white;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
    .system-info {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 1rem;
      color: white;
      margin-bottom: 2rem;
      backdrop-filter: blur(10px);
    }
    .system-info p {
      margin: 0.5rem 0;
    }
    .test-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .test-section h2 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .test-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
      font-weight: 500;
    }
    button:hover {
      background: #5a67d8;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
      transform: none;
    }
    #testResults {
      background: #f7fafc;
      border-radius: 8px;
      padding: 1rem;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
      max-height: 400px;
      overflow-y: auto;
      display: none;
    }
    #testResults.show {
      display: block;
    }
    .result-success {
      color: #10b981;
    }
    .result-error {
      color: #ef4444;
    }
    .result-info {
      color: #3182ce;
    }
    .hack-item {
      background: white;
      border-left: 4px solid #667eea;
      padding: 0.75rem;
      margin: 0.5rem 0;
      border-radius: 4px;
    }
    .hack-name {
      font-weight: bold;
      color: #2d3748;
    }
    .hack-category {
      color: #718096;
      font-size: 0.85rem;
    }
    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }
      h1 {
        font-size: 2rem;
      }
      .status-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 NRGHax Bot Status</h1>

    <div class="system-info">
      <p><strong>System:</strong> ${systemInfo.uptime || 'N/A'}</p>
      <p><strong>Memory:</strong> ${systemInfo.memory || 'N/A'}</p>
      <p><strong>Disk Usage:</strong> ${systemInfo.disk || 'N/A'}</p>
    </div>

    <div class="status-grid">
      <div class="status-card">
        <h3>Bot Status</h3>
        <div class="status-value ${botStatus.status === 'online' ? 'status-online' : 'status-offline'}">
          ${botStatus.status === 'online' ? '🟢 Online' : '🔴 ' + botStatus.status}
        </div>
      </div>

      <div class="status-card">
        <h3>Uptime</h3>
        <div class="status-value">
          ${formatUptime(botStatus.uptime || 0)}
        </div>
      </div>

      <div class="status-card">
        <h3>Memory Usage</h3>
        <div class="status-value">
          ${botStatus.memory || 0} MB
        </div>
      </div>

      <div class="status-card">
        <h3>CPU Usage</h3>
        <div class="status-value">
          ${botStatus.cpu || 0}%
        </div>
      </div>

      <div class="status-card">
        <h3>Restarts</h3>
        <div class="status-value">
          ${botStatus.restarts || 0}
        </div>
      </div>

      <div class="status-card">
        <h3>Process ID</h3>
        <div class="status-value">
          ${botStatus.pid || 'N/A'}
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>🧪 Database Test Actions</h2>
      <div class="test-buttons">
        <button onclick="testConnection()">🔌 Test Connection</button>
        <button onclick="fetchHacks()">📚 Fetch Hacks</button>
        <button onclick="fetchProfiles()">👥 Fetch Profiles</button>
        <button onclick="getDatabaseStats()">📊 Database Stats</button>
        <button onclick="createTestHack()">➕ Create Test Hack</button>
        <button onclick="clearResults()">🧹 Clear Results</button>
      </div>
      <div id="testResults"></div>
    </div>

    <div class="log-section">
      <h2>📝 Recent Activity</h2>
      <div class="log-content">
${combinedLog}
      </div>
    </div>

    <div class="log-section">
      <h2>⚠️ Recent Errors</h2>
      <div class="log-content error-log">
${errorLog || 'No recent errors'}
      </div>
    </div>

    <p class="refresh-note">↻ Auto-refreshing every 30 seconds</p>
  </div>

  <script>
    const resultsDiv = document.getElementById('testResults');

    function showResult(message, type = 'info') {
      const timestamp = new Date().toLocaleTimeString();
      const className = type === 'error' ? 'result-error' :
                        type === 'success' ? 'result-success' :
                        'result-info';

      resultsDiv.innerHTML += \`<div class="\${className}">[\${timestamp}] \${message}</div>\`;
      resultsDiv.classList.add('show');
      resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    function clearResults() {
      resultsDiv.innerHTML = '';
      resultsDiv.classList.remove('show');
    }

    async function testConnection() {
      showResult('Testing database connection...', 'info');
      try {
        const response = await fetch('/api/test-connection');
        const data = await response.json();

        if (data.success) {
          showResult('✅ Database connection successful!', 'success');
        } else {
          showResult(\`❌ Connection failed: \${data.error}\`, 'error');
        }
      } catch (error) {
        showResult(\`❌ Request failed: \${error.message}\`, 'error');
      }
    }

    async function fetchHacks() {
      showResult('Fetching hacks from database...', 'info');
      try {
        const response = await fetch('/api/fetch-hacks');
        const data = await response.json();

        if (data.success) {
          showResult(\`✅ Found \${data.count} hack(s)\`, 'success');

          if (data.hacks && data.hacks.length > 0) {
            data.hacks.forEach(hack => {
              const hackHtml = \`
                <div class="hack-item">
                  <div class="hack-name">\${hack.name}</div>
                  <div class="hack-category">Category: \${hack.category || 'N/A'}</div>
                  <div class="hack-category">ID: \${hack.id}</div>
                </div>
              \`;
              resultsDiv.innerHTML += hackHtml;
            });
          }
        } else {
          showResult(\`❌ Failed to fetch hacks: \${data.error}\`, 'error');
        }
      } catch (error) {
        showResult(\`❌ Request failed: \${error.message}\`, 'error');
      }
    }

    async function fetchProfiles() {
      showResult('Fetching profiles from database...', 'info');
      try {
        const response = await fetch('/api/fetch-profiles');
        const data = await response.json();

        if (data.success) {
          showResult(\`✅ Found \${data.count} profile(s)\`, 'success');

          if (data.profiles && data.profiles.length > 0) {
            data.profiles.forEach(profile => {
              showResult(\`   Profile: \${profile.id.substring(0, 8)}... Discord: \${profile.discord_id || 'N/A'}\`, 'info');
            });
          }
        } else {
          showResult(\`❌ Failed to fetch profiles: \${data.error}\`, 'error');
        }
      } catch (error) {
        showResult(\`❌ Request failed: \${error.message}\`, 'error');
      }
    }

    async function getDatabaseStats() {
      showResult('Getting database statistics...', 'info');
      try {
        const response = await fetch('/api/database-stats');
        const data = await response.json();

        if (data.success) {
          showResult('✅ Database Statistics:', 'success');
          showResult(\`   Total Hacks: \${data.stats.hacks}\`, 'info');
          showResult(\`   Total Profiles: \${data.stats.profiles}\`, 'info');
          showResult(\`   Total User Hacks: \${data.stats.userHacks}\`, 'info');
        } else {
          showResult(\`❌ Failed to get stats: \${data.error}\`, 'error');
        }
      } catch (error) {
        showResult(\`❌ Request failed: \${error.message}\`, 'error');
      }
    }

    async function createTestHack() {
      if (!confirm('This will create a test hack in the database. Continue?')) {
        return;
      }

      showResult('Creating test hack...', 'info');
      try {
        const response = await fetch('/api/create-test-hack', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
          showResult(\`✅ Created test hack: "\${data.hack.name}"\`, 'success');
          showResult(\`   ID: \${data.hack.id}\`, 'info');
          showResult(\`   Category: \${data.hack.category}\`, 'info');
        } else {
          showResult(\`❌ Failed to create hack: \${data.error}\`, 'error');
        }
      } catch (error) {
        showResult(\`❌ Request failed: \${error.message}\`, 'error');
      }
    }
  </script>
</body>
</html>
  `;

  res.send(html);
});

app.get('/api/status', async (req, res) => {
  const botStatus = await getBotStatus();
  const systemInfo = await getSystemInfo();

  res.json({
    bot: botStatus,
    system: systemInfo,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌐 Bot Status Server running at:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT}`);
  console.log(`\n📊 API endpoints:`);
  console.log(`   GET  /api/status          - Bot and system status`);
  console.log(`   GET  /api/test-connection - Test database connection`);
  console.log(`   GET  /api/fetch-hacks     - Fetch hacks from database`);
  console.log(`   GET  /api/fetch-profiles  - Fetch profiles from database`);
  console.log(`   GET  /api/database-stats  - Get database statistics`);
  console.log(`   POST /api/create-test-hack - Create a test hack`);
  console.log('\n✨ Page auto-refreshes every 30 seconds');
});