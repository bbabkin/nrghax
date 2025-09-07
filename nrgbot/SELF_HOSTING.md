# NRGhax Discord Bot - Self-Hosting Guide

This guide will help you self-host the NRGhax Discord Bot on your own infrastructure, including Raspberry Pi 5.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Discord Bot Setup](#discord-bot-setup)
- [Installation Methods](#installation-methods)
  - [Docker (Recommended)](#docker-recommended)
  - [Manual Installation](#manual-installation)
  - [Raspberry Pi 5 Setup](#raspberry-pi-5-setup)
- [Configuration](#configuration)
- [Running the Bot](#running-the-bot)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Minimum**: 512MB RAM, 1 CPU core
- **Recommended**: 1GB RAM, 2 CPU cores
- **Storage**: 500MB free space
- **OS**: Linux (Ubuntu 20.04+, Debian 11+), macOS, Windows with WSL2, or Raspberry Pi OS

### Software Requirements
- Node.js 18+ (for manual installation)
- Docker & Docker Compose (for Docker installation)
- Git
- A Supabase instance (local or cloud)

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" section
4. Click "Add Bot"
5. Save the **Bot Token** (you'll need this later)
6. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent

### 2. Get OAuth2 Information

1. In your application, go to "OAuth2" → "General"
2. Copy your **Client ID**
3. Add redirect URLs if needed for OAuth2 flows

### 3. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions:
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
   - Manage Roles
   - View Channels
4. Copy the generated URL and open it to invite the bot

## Installation Methods

### Docker (Recommended)

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/nrghax.git
cd nrghax/nrgbot
```

#### 2. Create Environment File
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_dev_guild_id_here  # Optional, for development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Bot Configuration
NODE_ENV=production
LOG_LEVEL=info

# Admin Configuration
ADMIN_USER_IDS=discord_user_id_1,discord_user_id_2

# Sync Configuration
ROLE_SYNC_INTERVAL_MINUTES=30
CACHE_TTL_SECONDS=300
```

#### 3. Run with Docker Compose
```bash
# Production
docker-compose up -d

# Development (with hot reload)
docker-compose --profile dev up nrgbot-dev

# View logs
docker-compose logs -f nrgbot

# Stop the bot
docker-compose down
```

### Manual Installation

#### 1. Clone and Install Dependencies
```bash
git clone https://github.com/yourusername/nrghax.git
cd nrghax/nrgbot
npm install
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Build and Run
```bash
# Build TypeScript
npm run build

# Deploy commands
npm run deploy-commands

# Start the bot
npm start

# Or run in development mode
npm run dev
```

### Raspberry Pi 5 Setup

#### 1. Prepare Raspberry Pi OS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 20.x
npm --version
```

#### 2. Install Docker (Optional, for Docker method)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose

# Reboot to apply changes
sudo reboot
```

#### 3. Clone and Setup Bot
```bash
# Create directory for bot
mkdir -p ~/bots
cd ~/bots

# Clone repository
git clone https://github.com/yourusername/nrghax.git
cd nrghax/nrgbot

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your configuration
```

#### 4. Run on Raspberry Pi

**Option A: Using Docker**
```bash
# Build and run
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f nrgbot
```

**Option B: Manual with PM2**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Install dependencies
npm install

# Build the bot
npm run build

# Start with PM2
pm2 start dist/index.js --name nrgbot

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command

# View logs
pm2 logs nrgbot

# Monitor
pm2 monit
```

#### 5. Optimize for Raspberry Pi
```bash
# Limit memory usage in PM2
pm2 start dist/index.js --name nrgbot --max-memory-restart 400M

# Or in docker-compose.yml, already configured with:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Bot token from Discord | Yes | - |
| `DISCORD_CLIENT_ID` | Application client ID | Yes | - |
| `DISCORD_GUILD_ID` | Development guild ID | No | - |
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No | info |
| `ADMIN_USER_IDS` | Comma-separated Discord user IDs for admins | No | - |
| `ROLE_SYNC_INTERVAL_MINUTES` | How often to sync roles | No | 30 |
| `CACHE_TTL_SECONDS` | Cache time-to-live | No | 300 |

### Supabase Setup

1. Ensure your Supabase database has the required tables:
   - `profiles` table with `discord_id`, `discord_username`, `discord_roles` columns
   - `hacks` table with hack information
   - `user_hacks` table for tracking user progress

2. Add indexes for performance:
```sql
CREATE INDEX idx_profiles_discord_id ON profiles(discord_id);
CREATE INDEX idx_hacks_published ON hacks(is_published);
CREATE INDEX idx_user_hacks_user ON user_hacks(user_id);
```

## Running the Bot

### Using systemd (Linux)

Create a service file:
```bash
sudo nano /etc/systemd/system/nrgbot.service
```

Add the following:
```ini
[Unit]
Description=NRGhax Discord Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/bots/nrghax/nrgbot
ExecStart=/usr/bin/node /home/your-username/bots/nrghax/nrgbot/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/nrgbot/output.log
StandardError=append:/var/log/nrgbot/error.log

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
# Create log directory
sudo mkdir -p /var/log/nrgbot
sudo chown your-username:your-username /var/log/nrgbot

# Enable and start service
sudo systemctl enable nrgbot
sudo systemctl start nrgbot

# Check status
sudo systemctl status nrgbot

# View logs
sudo journalctl -u nrgbot -f
```

## Monitoring & Maintenance

### Health Checks

The bot includes built-in health checks that monitor:
- Discord connection status
- Database connectivity
- Memory usage

### Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

### Monitoring with PM2

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs nrgbot --lines 100

# Restart bot
pm2 restart nrgbot

# Stop bot
pm2 stop nrgbot
```

### Backup

Regular backups recommended for:
- `.env` file (store securely)
- `logs/` directory
- Any local data files

## Troubleshooting

### Bot Won't Start

1. **Check environment variables**
```bash
# Verify .env file exists and is configured
cat .env | grep -E "DISCORD_TOKEN|SUPABASE_URL"
```

2. **Check logs**
```bash
# Docker
docker-compose logs nrgbot

# PM2
pm2 logs nrgbot --err

# Manual
cat logs/error.log
```

3. **Verify Node.js version**
```bash
node --version  # Should be 18.0.0 or higher
```

### Bot Is Online But Commands Don't Work

1. **Re-deploy commands**
```bash
npm run deploy-commands
```

2. **Check bot permissions in Discord**
- Ensure bot has necessary permissions in the server
- Verify slash command permissions

3. **Check intents in Discord Developer Portal**
- Server Members Intent must be enabled
- Message Content Intent must be enabled

### Database Connection Issues

1. **Verify Supabase is accessible**
```bash
curl https://your-project.supabase.co/rest/v1/
```

2. **Check service role key**
- Ensure you're using the service role key, not the anon key
- Verify the key hasn't been regenerated

### Memory Issues on Raspberry Pi

1. **Reduce cache TTL**
```env
CACHE_TTL_SECONDS=60
```

2. **Increase swap space**
```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

3. **Use memory limits**
```bash
# PM2
pm2 start dist/index.js --name nrgbot --max-memory-restart 300M

# Docker - already configured in docker-compose.yml
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Missing Discord token" | Set `DISCORD_TOKEN` in `.env` |
| "Invalid token" | Regenerate bot token in Discord Developer Portal |
| "Missing Access" | Bot lacks permissions in the server |
| "Unknown interaction" | Re-deploy slash commands |
| "ECONNREFUSED" | Check Supabase URL and network connectivity |

## Security Best Practices

1. **Never commit `.env` file to git**
2. **Use strong, unique bot token**
3. **Regularly rotate credentials**
4. **Keep dependencies updated**
```bash
npm audit
npm update
```
5. **Use firewall rules on production servers**
6. **Enable 2FA on Discord developer account**
7. **Monitor admin notifications for errors**

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check Discord.js documentation
4. Open an issue on GitHub

## License

This bot is part of the NRGhax project. See the main repository for license information.