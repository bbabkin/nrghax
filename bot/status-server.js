const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = 3333;

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
      const startTime = parts[8];

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
  <meta http-equiv="refresh" content="10">
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

    <p class="refresh-note">↻ Auto-refreshing every 10 seconds</p>
  </div>
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
  console.log(`\n📊 API endpoint: http://localhost:${PORT}/api/status`);
  console.log('\n✨ Page auto-refreshes every 10 seconds');
});