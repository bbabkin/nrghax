# NRGhax Bot Monitoring & Auto-Start Guide

## 🎯 Overview

This guide covers the monitoring system and auto-start configuration for the NRGhax Discord bot.

## 📊 Monitoring Dashboard

### Live Monitor Console

Run the interactive monitoring dashboard:

```bash
./bot-monitor.sh
```

Features:
- **Real-time Status**: Shows if bot is running/stopped with PID and memory usage
- **Metrics Display**: Commands executed, errors, uptime
- **Activity Feed**: Last 15 activity entries (commands, API calls, errors)
- **Error Monitoring**: Recent errors displayed in red
- **Interactive Controls**:
  - `s` - Start bot
  - `r` - Restart bot
  - `k` - Kill/stop bot
  - `l` - View full logs
  - `c` - Clear screen
  - `q` - Quit monitor

### Command-line Options

```bash
# Start the bot
./bot-monitor.sh start

# Stop the bot
./bot-monitor.sh stop

# Restart the bot
./bot-monitor.sh restart

# Check status only
./bot-monitor.sh status

# Tail logs
./bot-monitor.sh logs
```

## 🚀 Auto-Start Setup

### Option 1: PM2 (Recommended - Easier)

PM2 is a production process manager for Node.js that makes managing the bot simple.

#### Setup
```bash
# Run the PM2 setup script
./setup-pm2.sh
```

This will:
- Install PM2 if needed
- Build and start the bot
- Configure auto-start on system boot
- Save the PM2 process list

#### PM2 Commands
```bash
# View bot status
pm2 status

# View logs
pm2 logs nrghax-bot

# Monitor (interactive dashboard)
pm2 monit

# Restart bot
pm2 restart nrghax-bot

# Stop bot
pm2 stop nrghax-bot

# Start bot
pm2 start nrghax-bot

# Remove from PM2
pm2 delete nrghax-bot
```

### Option 2: Systemd Service (Advanced)

For systems using systemd (most modern Linux distributions).

#### Setup
```bash
# Run the systemd setup script (requires sudo)
sudo ./setup-autostart.sh
```

#### Systemd Commands
```bash
# Start bot
sudo systemctl start nrghax-bot

# Stop bot
sudo systemctl stop nrghax-bot

# Restart bot
sudo systemctl restart nrghax-bot

# View status
sudo systemctl status nrghax-bot

# View logs
sudo journalctl -u nrghax-bot -f

# Enable auto-start
sudo systemctl enable nrghax-bot

# Disable auto-start
sudo systemctl disable nrghax-bot
```

## 📁 Log Files

The bot creates several log files in the `logs/` directory:

- **activity.log** - Formatted activity feed (commands, API calls, health checks)
- **combined.log** - All logs in JSON format
- **error.log** - Error logs only
- **exceptions.log** - Uncaught exceptions
- **rejections.log** - Unhandled promise rejections
- **metrics.json** - Real-time metrics (updated every 30 seconds)
- **console.log** - Console output when running via monitor script
- **pm2-*.log** - PM2 specific logs (if using PM2)
- **systemd*.log** - Systemd logs (if using systemd)

## 📈 Enhanced Logging

The bot now logs:
- 🤖 **Bot Start/Stop** - With PID, uptime, and resource info
- 📝 **Commands** - Every command execution with user and guild info
- 🌐 **API Calls** - External API interactions
- ❌ **Errors** - Detailed error logging with stack traces
- 💓 **Health Checks** - Periodic health status
- 📦 **Code Updates** - File modifications (if watching enabled)

## 🔧 Troubleshooting

### Bot Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Check Node.js version
node --version  # Should be 16+

# Rebuild
cd /home/coder/.ssh/code/mine/nrghax/bot
npm run build

# Check environment variables
cat .env
```

### Bot Crashes on Start
```bash
# Check error logs
tail -n 50 logs/error.log

# Check exceptions
tail -n 50 logs/exceptions.log

# Run in dev mode for debugging
npm run dev
```

### PM2 Issues
```bash
# Reset PM2
pm2 kill
pm2 resurrect

# Clear PM2 logs
pm2 flush

# Update PM2
npm install -g pm2@latest
pm2 update
```

### Systemd Issues
```bash
# Check service status
sudo systemctl status nrghax-bot

# Check service logs
sudo journalctl -u nrghax-bot -n 100

# Reload if service file changed
sudo systemctl daemon-reload
sudo systemctl restart nrghax-bot
```

## 🎨 Monitoring Dashboard Colors

The dashboard uses colors to indicate different types of activity:
- 🟢 **Green** - Bot started, running status
- 🔴 **Red** - Bot stopped, errors
- 🔵 **Blue** - Command executions
- 🟡 **Yellow** - API calls, warnings
- 🟣 **Purple** - Health checks
- 🟦 **Cyan** - Code updates, headers

## 📊 Metrics Tracking

The bot tracks and displays:
- **Uptime** - How long the bot has been running
- **Commands Executed** - Total command count
- **Error Count** - Total errors encountered
- **Last Activity** - Timestamp of last action
- **Memory Usage** - Current RAM consumption
- **Process ID** - System PID for the bot process

## 🔐 Security Notes

- The bot token is stored in `.env` file (not committed to git)
- Logs are rotated automatically to prevent disk space issues
- Memory is limited to 512MB (configurable in service files)
- CPU usage is limited to 50% (systemd only)

## 📝 Quick Start

1. **First Time Setup**:
   ```bash
   cd /home/coder/.ssh/code/mine/nrghax/bot
   npm install
   npm run build
   ```

2. **Choose Auto-Start Method**:
   ```bash
   # Easy way (PM2)
   ./setup-pm2.sh

   # OR Advanced way (systemd)
   sudo ./setup-autostart.sh
   ```

3. **Monitor Your Bot**:
   ```bash
   ./bot-monitor.sh
   ```

## 🆘 Need Help?

- Check logs in `logs/` directory
- Run monitor in debug mode: `./bot-monitor.sh logs`
- Check bot health: `./bot-monitor.sh status`
- Verify environment: `node -v && npm -v && cat .env`