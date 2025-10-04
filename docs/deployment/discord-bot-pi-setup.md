# Discord Bot Setup for Raspberry Pi 5

This document provides instructions for setting up the Discord bot component of the NRGhax tag synchronization system on a Raspberry Pi 5.

## Architecture Overview

The sync system uses a hybrid architecture:
- **Web App (Vercel)**: Handles onboarding, tag management, and database operations
- **Discord Bot (Pi)**: Manages Discord role changes and syncs with the web app
- **Supabase**: Central database for tags and sync logs

```
┌─────────────────────┐         ┌──────────────────┐
│   Raspberry Pi 5    │         │  Vercel/Next.js  │
│                     │         │                  │
│  Discord Bot        │◄────────►  Web App        │
│  - Role listener    │ Webhook │  - Tag manager  │
│  - Role updater     │  APIs   │  - Sync endpoint│
└─────────────────────┘         └──────────────────┘
         │                               │
         └──────────┬────────────────────┘
                    ▼
            ┌──────────────┐
            │   Supabase   │
            │  - Tags DB   │
            │  - Sync logs │
            └──────────────┘
```

## Bot Responsibilities

The Discord bot on the Pi handles:
1. **Listening to Discord role changes** (member role add/remove events)
2. **Sending webhooks to the web app** when roles change
3. **Receiving sync requests from the web app** via webhook
4. **Applying role updates to Discord users** based on web tag changes

## Environment Variables

Create a `.env` file in your bot directory with:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here

# Web App Webhook Configuration
WEB_APP_WEBHOOK_URL=https://your-app.vercel.app/api/discord/webhook
WEB_APP_WEBHOOK_SECRET=generate_a_secure_random_string_here

# Bot Webhook Server (for receiving updates from web app)
BOT_WEBHOOK_PORT=3001
BOT_WEBHOOK_SECRET=same_as_WEB_APP_WEBHOOK_SECRET

# Supabase Configuration (optional, for direct DB access)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Discord Bot Implementation

### Required Dependencies

```json
{
  "dependencies": {
    "discord.js": "^14.14.1",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2",
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

### Bot Code Structure

```javascript
// bot.js
const { Client, GatewayIntentBits, Events } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ]
});

// Initialize Express for webhook server
const app = express();
app.use(express.json());

// Role change tracking
const roleChanges = new Map();

// Discord Events
client.on(Events.ClientReady, () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

// Listen for role updates
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
  const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

  const changes = [];

  addedRoles.forEach(role => {
    changes.push({
      action: 'add',
      roleName: role.name,
      roleId: role.id,
      timestamp: new Date().toISOString()
    });
  });

  removedRoles.forEach(role => {
    changes.push({
      action: 'remove',
      roleName: role.name,
      roleId: role.id,
      timestamp: new Date().toISOString()
    });
  });

  if (changes.length > 0) {
    await syncRolesToWebApp(newMember, changes);
  }
});

// Function to sync role changes to web app
async function syncRolesToWebApp(member, changes) {
  try {
    const response = await fetch(process.env.WEB_APP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEB_APP_WEBHOOK_SECRET
      },
      body: JSON.stringify({
        type: 'ROLE_CHANGE',
        userId: member.user.id,
        discordId: member.user.id,
        username: member.user.username,
        changes: changes
      })
    });

    if (!response.ok) {
      console.error('Failed to sync to web app:', response.statusText);
    } else {
      console.log(`Synced ${changes.length} role changes for ${member.user.username}`);
    }
  } catch (error) {
    console.error('Error syncing to web app:', error);
  }
}

// Webhook endpoint to receive sync requests from web app
app.post('/webhook/sync', async (req, res) => {
  // Verify webhook secret
  if (req.headers['x-webhook-secret'] !== process.env.BOT_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, discordId, updates } = req.body;

  if (type !== 'ROLE_SYNC') {
    return res.status(400).json({ error: 'Invalid webhook type' });
  }

  try {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(discordId);

    for (const update of updates) {
      const role = guild.roles.cache.find(r =>
        r.name === update.roleName || r.id === update.roleId
      );

      if (!role) {
        console.warn(`Role not found: ${update.roleName}`);
        continue;
      }

      if (update.action === 'add') {
        await member.roles.add(role);
        console.log(`Added role ${role.name} to ${member.user.username}`);
      } else if (update.action === 'remove') {
        await member.roles.remove(role);
        console.log(`Removed role ${role.name} from ${member.user.username}`);
      }
    }

    res.json({ success: true, processed: updates.length });
  } catch (error) {
    console.error('Error processing sync request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    botConnected: client.ws.status === 0,
    uptime: process.uptime()
  });
});

// Start webhook server
app.listen(process.env.BOT_WEBHOOK_PORT || 3001, () => {
  console.log(`Webhook server listening on port ${process.env.BOT_WEBHOOK_PORT || 3001}`);
});

// Login bot
client.login(process.env.DISCORD_BOT_TOKEN);
```

## Role Mapping Configuration

The bot needs to know which Discord roles correspond to which tags. This mapping is stored in the Supabase database:

### Tag-Role Mapping Table Structure
```sql
-- Already created in the web app migration
-- tags table includes:
-- - discord_role_name: The exact Discord role name
-- - discord_role_id: The Discord role ID (optional, for faster lookups)
```

### Supported Tag Types for Sync
- `user_experience`: Beginner, Intermediate, Expert (mutually exclusive)
- `user_interest`: Web Security, Binary Exploitation, etc. (multiple allowed)
- `user_special`: Mentor, Verified, etc. (admin-managed)

## Installation on Raspberry Pi

1. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Create bot directory**
```bash
mkdir ~/nrghax-bot
cd ~/nrghax-bot
```

3. **Initialize project**
```bash
npm init -y
npm install discord.js express dotenv node-fetch @supabase/supabase-js
```

4. **Create bot files**
- Copy the bot.js code above
- Create .env file with your credentials

5. **Set up systemd service** (for auto-start)
```bash
sudo nano /etc/systemd/system/nrghax-bot.service
```

Add:
```ini
[Unit]
Description=NRGhax Discord Bot
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/nrghax-bot
ExecStart=/usr/bin/node bot.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

6. **Enable and start service**
```bash
sudo systemctl enable nrghax-bot
sudo systemctl start nrghax-bot
sudo systemctl status nrghax-bot
```

## Webhook Security

### Setting up Cloudflare Tunnel (Recommended)
To securely expose your Pi's webhook endpoint:

1. Install cloudflared:
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb
```

2. Create tunnel:
```bash
cloudflared tunnel create nrghax-bot
cloudflared tunnel route dns nrghax-bot bot.yourdomain.com
```

3. Configure tunnel:
```yaml
# ~/.cloudflared/config.yml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/pi/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: bot.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

4. Run tunnel:
```bash
cloudflared tunnel run nrghax-bot
```

## Monitoring and Logs

View bot logs:
```bash
# If using systemd
sudo journalctl -u nrghax-bot -f

# Or check the webhook server health
curl http://localhost:3001/webhook/health
```

## Troubleshooting

### Bot not receiving role updates
- Check Discord bot permissions (needs "Manage Roles" permission)
- Verify bot intents are enabled in Discord Developer Portal
- Check if the bot's role is higher than roles it needs to manage

### Webhooks not working
- Verify webhook secrets match between bot and web app
- Check firewall rules if using direct connection
- Verify Cloudflare tunnel is running if using tunnel

### Sync conflicts
- Check tag_sync_log table in Supabase for error details
- Verify tag_type rules are being enforced
- Check for rate limiting from Discord API

## Testing the Integration

1. **Test Discord → Web sync**:
   - Manually add/remove a role in Discord
   - Check tag_sync_log table in Supabase
   - Verify tag appears in user's profile on web app

2. **Test Web → Discord sync**:
   - Complete onboarding on web app
   - Check if corresponding Discord roles are added
   - Verify sync log shows successful sync

3. **Test conflict resolution**:
   - Assign conflicting experience levels
   - Verify mutual exclusivity is maintained

## Security Considerations

1. **Never commit .env files** to version control
2. **Use strong webhook secrets** (generate with `openssl rand -hex 32`)
3. **Implement rate limiting** for webhook endpoints
4. **Use HTTPS** for all webhook communications
5. **Regularly update** bot dependencies
6. **Monitor** for unusual sync patterns or errors

## Support

For issues with:
- Web app: Check logs in Vercel dashboard
- Discord bot: Check Pi logs with journalctl
- Database: Check Supabase logs and sync_log table