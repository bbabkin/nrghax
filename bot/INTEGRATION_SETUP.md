# NRGHax Bot Integration Setup Guide

This guide explains how to configure the unified NRGHax bot for Discord and Slack platforms.

## 🏗️ Architecture Overview

The bot uses **Gateway/Socket connections** instead of webhooks, which means:
- ✅ **No HTTP endpoints required**
- ✅ **No ngrok or public URLs needed**
- ✅ **Works behind firewalls/NAT**
- ✅ **Real-time event handling**
- ✅ **More secure (no inbound traffic)**

## 🟦 Discord Setup

### Prerequisites
- Discord Developer Portal access
- Bot already created (✅ Done)

### Current Configuration Status
```bash
DISCORD_TOKEN=MTQxMzM1NDE0... ✅ Configured
DISCORD_CLIENT_ID=1411335145771761746 ✅ Configured
```

### Discord Developer Portal Configuration

1. **Go to**: https://discord.com/developers/applications
2. **Select your bot application**
3. **Bot Section**:
   - Token: Already configured ✅
   - Privileged Gateway Intents: Enable as needed

4. **OAuth2 → Scopes**:
   - ✅ `bot`
   - ✅ `applications.commands`

5. **OAuth2 → Bot Permissions**:
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Embed Links
   - ✅ Add Reactions
   - Add others as needed for your commands

6. **No Webhook URLs Required** 🎉
   - The bot connects TO Discord via Gateway
   - Discord doesn't need to call back to your server

### Testing Discord
```bash
# Test Discord only
ENABLE_DISCORD=true ENABLE_SLACK=false node dist/index-new.js
```

## 🟩 Slack Setup

### Prerequisites
- Slack workspace admin access
- Create new Slack app

### Step 1: Create Slack App
1. **Go to**: https://api.slack.com/apps
2. **Click**: "Create New App"
3. **Choose**: "From scratch"
4. **Name**: "NRGHax Bot"
5. **Workspace**: Select your workspace

### Step 2: Enable Socket Mode
1. **Go to**: Settings → Socket Mode
2. **Toggle**: Enable Socket Mode
3. **Create App-Level Token**:
   - Name: "Socket Mode Token"
   - Scopes: `connections:write`
   - **Copy the token** (starts with `xapp-`)

### Step 3: Configure Bot Token
1. **Go to**: Features → OAuth & Permissions
2. **Bot Token Scopes** (add these):
   - `chat:write` - Send messages
   - `commands` - Create and respond to slash commands
   - `reactions:read` - Read message reactions
   - `reactions:write` - Add reactions to messages
   - `users:read` - View user info
   - `channels:read` - View channel info

3. **Install App to Workspace**
4. **Copy Bot User OAuth Token** (starts with `xoxb-`)

### Step 4: Add Slash Commands
1. **Go to**: Features → Slash Commands
2. **Create New Command**:
   ```
   Command: /ping
   Request URL: Not needed (Socket Mode)
   Short Description: Test bot connectivity
   ```
3. **Create New Command**:
   ```
   Command: /hack
   Request URL: Not needed (Socket Mode)
   Short Description: Browse and discover energy hacks
   ```

### Step 5: Configure Environment Variables
```bash
# Add to .env file
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here
ENABLE_SLACK=true
```

**To find Signing Secret**:
- Go to Settings → Basic Information
- App Credentials → Signing Secret

### Testing Slack
```bash
# Test Slack only
ENABLE_DISCORD=false ENABLE_SLACK=true node dist/index-new.js
```

## 🚀 Running Both Platforms

### Environment Configuration
```bash
# Enable both platforms
ENABLE_DISCORD=true
ENABLE_SLACK=true

# Core settings (already configured)
SUPABASE_URL=https://chbfahyrdfoboddqahdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...

# Discord (already configured)
DISCORD_TOKEN=MTQxMzM...
DISCORD_CLIENT_ID=1411335145771761746

# Slack (to be configured)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here
```

### Start Unified Bot
```bash
npm run build
node dist/index-new.js
```

### Expected Output
```
🚀 Starting NRGHax Unified Bot...
🟦 Initializing Discord platform...
✅ Discord bot logged in as NRGHAX#3788
✅ Discord platform ready
🟩 Initializing Slack platform...
✅ Slack bot is running!
✅ Slack platform ready
Successfully deployed 2 Discord commands
✅ NRGHax Unified Bot is fully operational!
📊 Active platforms: Discord, Slack
```

## 🛠️ Commands Available

Both platforms support the same commands:

### `/ping`
- Tests bot connectivity
- Shows response time

### `/hack`
- **`/hack list`** - Browse all energy hacks
- **`/hack search [query]`** - Search for specific hacks
- **`/hack category [name]`** - Browse by category

**Categories**:
- Morning Routine
- Exercise
- Nutrition
- Sleep
- Productivity
- Mindfulness
- Energy Management
- Wellness

## 🔧 Troubleshooting

### Discord Issues
- **Bot not responding**: Check `DISCORD_TOKEN` is valid
- **Commands not appearing**: Verify OAuth2 scopes include `applications.commands`
- **Permission errors**: Check bot permissions in server settings

### Slack Issues
- **Socket connection failed**: Check `SLACK_APP_TOKEN` (starts with `xapp-`)
- **Commands not working**: Verify slash commands are created in Slack dashboard
- **Auth errors**: Check `SLACK_BOT_TOKEN` (starts with `xoxb-`)

### General Issues
- **Build errors**: Run `npm run build` first
- **Environment variables**: Check all required vars are set
- **Database connection**: Verify Supabase credentials

## 📈 Monitoring

The bot includes built-in health monitoring:
- Health checks every 60 seconds
- Platform status tracking
- Service health monitoring
- Graceful shutdown handling

## 🔒 Security Notes

- ✅ No public endpoints required
- ✅ All credentials in environment variables
- ✅ Gateway/Socket connections only
- ✅ No webhook vulnerabilities
- ✅ Outbound connections only

## 🚀 Production Deployment

For production, consider:
1. **Process Manager**: PM2 or similar
2. **Environment**: Separate staging/production configs
3. **Monitoring**: External health monitoring
4. **Logging**: Centralized log collection
5. **Secrets**: Use proper secret management

The bot is ready for production deployment without requiring any public endpoints or complex networking setup!