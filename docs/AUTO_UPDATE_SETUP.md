# Discord Bot Auto-Update Setup

## Overview
This auto-update system uses **GitHub Webhooks** to trigger updates only when you push changes - no constant polling required!

## How It Works
1. **GitHub sends a webhook** when you push to main/master
2. **Bot receives the webhook** on a small Express server
3. **Bot pulls changes**, builds, and restarts automatically
4. **Discord notification** sent to your specified channel
5. **PM2 restarts** the bot with new code

## Setup Instructions

### 1. Add Environment Variables to Bot
Add these to your `.env` file on the Raspberry Pi:

```bash
# Webhook Configuration
WEBHOOK_PORT=3001
GITHUB_WEBHOOK_SECRET=your-secret-here-generate-random-string
UPDATE_NOTIFICATION_CHANNEL_ID=your-discord-channel-id
MANUAL_UPDATE_TOKEN=another-random-token-for-manual-updates
BOT_VERSION=2.0.0
```

### 2. Install Express Dependency
```bash
cd ~/apps/nrghax/bot
npm install express
npm install --save-dev @types/express
```

### 3. Update Bot Index File
Add this to `bot/src/index.ts` after bot login:

```typescript
import { AutoUpdateService } from './services/autoUpdateService';

// After bot.login()
const autoUpdate = new AutoUpdateService(client);
autoUpdate.start();
logger.info('Auto-update service started');
```

### 4. Configure GitHub Webhook

#### On GitHub:
1. Go to your repository Settings
2. Click "Webhooks" → "Add webhook"
3. Configure:
   - **Payload URL**: `http://YOUR_PI_IP:3001/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Same as `GITHUB_WEBHOOK_SECRET` in .env
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Check

#### Example:
```
Payload URL: http://192.168.1.100:3001/webhook/github
Secret: my-super-secret-webhook-key-123
```

### 5. Configure Router/Firewall
Open port 3001 on your router to forward to your Raspberry Pi:

#### On Router (example):
```
External Port: 3001 → Internal IP: 192.168.1.100 → Internal Port: 3001
```

#### On Raspberry Pi:
```bash
# Allow webhook port
sudo ufw allow 3001/tcp
```

### 6. Setup PM2 Ecosystem with Auto-Update
Update your `ecosystem.config.js`:

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
    // Auto-update specific
    wait_ready: true,
    listen_timeout: 3000,
    kill_timeout: 5000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 7. Test the Setup

#### Test Webhook Locally:
```bash
# Send test webhook
curl -X POST http://localhost:3001/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"ref":"refs/heads/main","commits":[{"message":"Test update"}]}'
```

#### Test Manual Update:
```bash
curl -X POST http://localhost:3001/update/manual \
  -H "X-Update-Token: your-manual-token"
```

## Alternative: Ngrok Tunnel (No Port Forwarding)

If you can't open ports on your router, use ngrok:

### Install Ngrok:
```bash
# On Raspberry Pi
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Authenticate (get token from ngrok.com)
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

### Run Ngrok:
```bash
# Create systemd service for ngrok
sudo nano /etc/systemd/system/ngrok.service
```

Add:
```ini
[Unit]
Description=Ngrok Tunnel
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/bin/ngrok http 3001 --log=stdout
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Start ngrok
sudo systemctl enable ngrok
sudo systemctl start ngrok

# Get URL
curl http://localhost:4040/api/tunnels
```

Use the ngrok URL for GitHub webhook.

## Discord Commands

The bot now has `/update` commands:

```
/update status    - Check bot version and uptime
/update check     - Check for available updates
/update trigger   - Manually trigger update (admin only)
```

## Security Considerations

### 1. Use Strong Secrets
```bash
# Generate secure secrets
openssl rand -hex 32  # For GITHUB_WEBHOOK_SECRET
openssl rand -hex 32  # For MANUAL_UPDATE_TOKEN
```

### 2. Limit Update Permissions
Only allow updates from:
- Your GitHub repository
- Specific Discord admins
- Verified webhook signatures

### 3. Rate Limiting
Add to prevent abuse:

```typescript
// In autoUpdateService.ts
private lastUpdateTime = 0;
private minUpdateInterval = 60000; // 1 minute

private canUpdate(): boolean {
  const now = Date.now();
  if (now - this.lastUpdateTime < this.minUpdateInterval) {
    return false;
  }
  this.lastUpdateTime = now;
  return true;
}
```

## Monitoring

### Discord Notifications
Bot sends updates to specified channel:
- 🔄 Update detected
- ✅ Update successful
- ❌ Update failed
- 📦 Changes summary

### Logs
```bash
# View update logs
pm2 logs nrghax-bot | grep -i update

# View webhook server logs
pm2 logs nrghax-bot | grep -i webhook
```

### Health Check
```bash
# Check webhook server
curl http://localhost:3001/health
```

## Troubleshooting

### Webhook Not Received
1. Check firewall: `sudo ufw status`
2. Check port forwarding on router
3. Test with ngrok instead
4. Verify GitHub webhook is active

### Update Fails
1. Check git credentials are saved
2. Ensure proper permissions: `chmod -R 755 ~/apps/nrghax/bot`
3. Check PM2 logs: `pm2 logs nrghax-bot --err`
4. Manually test: `cd ~/apps/nrghax/bot && git pull`

### Bot Doesn't Restart
1. Check PM2 is running: `pm2 status`
2. Restart manually: `pm2 restart nrghax-bot`
3. Check auto-restart setting in ecosystem.config.js

## Advanced: CI/CD Pipeline

For even more automation, use GitHub Actions:

`.github/workflows/deploy-bot.yml`:
```yaml
name: Deploy Bot to Raspberry Pi

on:
  push:
    branches: [main]
    paths:
      - 'bot/**'

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Pi Update
        run: |
          curl -X POST ${{ secrets.PI_WEBHOOK_URL }} \
            -H "X-Update-Token: ${{ secrets.UPDATE_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"source": "github-actions"}'
```

## Summary

With this setup:
- ✅ **No polling** - Updates only when you push
- ✅ **Automatic** - No manual SSH needed
- ✅ **Notified** - See updates in Discord
- ✅ **Secure** - Verified signatures
- ✅ **Fast** - Updates in under 30 seconds
- ✅ **Reliable** - PM2 ensures uptime

The bot will now update itself whenever you push to GitHub!