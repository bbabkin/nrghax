# Discord Bot Deployment on Raspberry Pi

## Prerequisites

### 1. Raspberry Pi Setup
- Raspberry Pi 3B+ or newer (4 recommended)
- Raspbian OS (64-bit recommended)
- At least 8GB SD card
- Stable internet connection
- SSH enabled

### 2. Initial Pi Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install git curl build-essential -y
```

## Step-by-Step Deployment

### Step 1: Install Node.js
```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 2: Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (will need sudo)
```

### Step 3: Clone and Setup Bot
```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/nrghax.git
cd nrghax/bot

# Install dependencies
npm install --production

# Build the bot
npm run build
```

### Step 4: Configure Environment
```bash
# Create production env file
nano .env

# Add these variables:
DISCORD_TOKEN=your-discord-bot-token-here
DISCORD_CLIENT_ID=1411335145771761746
DISCORD_GUILD_ID=1403106908159606834
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
APP_URL=https://your-app-domain.com
NODE_ENV=production
LOG_LEVEL=info

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 5: Create PM2 Ecosystem File
```bash
# Create ecosystem file
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'nrghax-bot',
    script: './dist/index.js',
    cwd: '/home/pi/apps/nrghax/bot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### Step 6: Create Log Directory
```bash
# Create logs directory
mkdir -p ~/apps/nrghax/bot/logs
```

### Step 7: Start the Bot
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs nrghax-bot

# Monitor resources
pm2 monit
```

### Step 8: Setup Auto-restart
```bash
# Save PM2 process list
pm2 save

# Ensure bot starts on reboot
pm2 startup
# Copy and run the command it outputs with sudo
```

## Maintenance Commands

### View Logs
```bash
# Real-time logs
pm2 logs nrghax-bot --lines 100

# Error logs only
pm2 logs nrghax-bot --err --lines 50
```

### Restart Bot
```bash
# Graceful restart
pm2 restart nrghax-bot

# Hard restart
pm2 stop nrghax-bot
pm2 start nrghax-bot
```

### Update Bot
```bash
cd ~/apps/nrghax
git pull origin master
cd bot
npm install --production
npm run build
pm2 restart nrghax-bot
```

### Monitor Performance
```bash
# PM2 monitoring
pm2 monit

# System resources
htop

# Check bot memory usage
pm2 describe nrghax-bot
```

## Optimization for Raspberry Pi

### 1. Reduce Memory Usage
```bash
# Edit ecosystem.config.js
nano ecosystem.config.js

# Add these options:
max_memory_restart: '200M',
node_args: '--max-old-space-size=256'
```

### 2. Enable Swap (if needed)
```bash
# Check current swap
free -h

# Create 1GB swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Setup Log Rotation
```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Security Hardening

### 1. Create Dedicated User
```bash
# Create bot user
sudo useradd -m -s /bin/bash botuser
sudo passwd botuser

# Switch to bot user
su - botuser

# Continue setup as botuser
```

### 2. Firewall Configuration
```bash
# Install ufw
sudo apt install ufw -y

# Allow SSH (change port if custom)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw --force enable
```

### 3. Fail2ban Setup
```bash
# Install fail2ban
sudo apt install fail2ban -y

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

## Monitoring Setup

### 1. Discord Webhook for Alerts
```javascript
// Add to bot code for crash notifications
process.on('uncaughtException', (error) => {
  // Send webhook to Discord
  fetch(process.env.ALERT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🚨 Bot crashed on Pi: ${error.message}`
    })
  });
});
```

### 2. Health Check Script
```bash
# Create health check
nano ~/apps/nrghax/bot/health-check.sh
```

Add:
```bash
#!/bin/bash
if ! pm2 describe nrghax-bot > /dev/null 2>&1; then
  pm2 start ~/apps/nrghax/bot/ecosystem.config.js
  echo "Bot restarted at $(date)" >> ~/apps/nrghax/bot/logs/restarts.log
fi
```

```bash
# Make executable
chmod +x ~/apps/nrghax/bot/health-check.sh

# Add to crontab
crontab -e
# Add this line:
*/5 * * * * /home/pi/apps/nrghax/bot/health-check.sh
```

## Troubleshooting

### Bot Won't Start
```bash
# Check logs
pm2 logs nrghax-bot --err

# Check Node version
node --version  # Must be 18+

# Check environment variables
pm2 env nrghax-bot

# Test manually
cd ~/apps/nrghax/bot
node dist/index.js
```

### High Memory Usage
```bash
# Restart with memory limit
pm2 delete nrghax-bot
pm2 start ecosystem.config.js --max-memory-restart 150M
```

### Network Issues
```bash
# Test Discord connection
curl -I https://discord.com

# Test Supabase connection
curl -I https://your-project.supabase.co

# Check DNS
nslookup discord.com
```

### Permission Errors
```bash
# Fix permissions
chmod -R 755 ~/apps/nrghax/bot
chmod 600 ~/apps/nrghax/bot/.env
```

## Performance Metrics

### Expected Resource Usage
- **RAM**: 100-200MB
- **CPU**: 5-15% average
- **Storage**: ~100MB for bot + logs
- **Network**: Minimal (< 1MB/hour)

### Raspberry Pi Model Recommendations
- **Pi 3B+**: Minimum, may experience occasional slowdowns
- **Pi 4 (2GB)**: Recommended, smooth operation
- **Pi 4 (4GB+)**: Ideal, can run multiple bots
- **Pi Zero 2W**: Possible but not recommended

## Backup Strategy

### 1. Automated Backups
```bash
# Create backup script
nano ~/backup-bot.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/bot_$DATE.tar.gz \
  ~/apps/nrghax/bot/.env \
  ~/apps/nrghax/bot/ecosystem.config.js \
  ~/apps/nrghax/bot/logs/

# Keep only last 7 backups
ls -t $BACKUP_DIR/bot_*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null
```

```bash
# Schedule daily backup
crontab -e
# Add:
0 2 * * * /home/pi/backup-bot.sh
```

### 2. Remote Backup (Optional)
```bash
# Sync to remote server
rsync -avz ~/backups/ user@backup-server:/path/to/backups/
```

## Quick Commands Reference

```bash
# Status
pm2 status

# Logs
pm2 logs nrghax-bot

# Restart
pm2 restart nrghax-bot

# Stop
pm2 stop nrghax-bot

# Start
pm2 start ecosystem.config.js

# Update & Restart
cd ~/apps/nrghax && git pull && cd bot && npm install --production && npm run build && pm2 restart nrghax-bot

# Monitor
pm2 monit

# Save state
pm2 save
```

## Final Checklist

- [ ] Node.js 20+ installed
- [ ] PM2 installed and configured
- [ ] Bot code cloned and built
- [ ] Environment variables set
- [ ] PM2 ecosystem file created
- [ ] Bot started successfully
- [ ] Auto-start on boot configured
- [ ] Logs directory created
- [ ] Log rotation configured
- [ ] Health check cron job added
- [ ] Backup strategy implemented
- [ ] Firewall configured
- [ ] Swap enabled (if needed)

---

**Note**: Replace all placeholder values (repository URL, tokens, etc.) with your actual values. Test thoroughly before considering the deployment complete!