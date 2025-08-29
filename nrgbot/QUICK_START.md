# NRGHAX Bot Quick Start Guide

## 🚀 From Zero to Running Bot in 30 Minutes

### Prerequisites
- Node.js 18+ installed
- Discord Developer Account
- Supabase Account (free tier works)
- Basic TypeScript knowledge

---

## Step 1: Discord Setup (5 min)

### Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "NRGHAX Bot" (or your preference)
4. Go to "Bot" section
5. Click "Reset Token" and save it securely
6. Enable these Privileged Gateway Intents:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT

### Get Your IDs
```bash
# In Discord, enable Developer Mode:
# User Settings → Advanced → Developer Mode

# Right-click your server → Copy Server ID
DISCORD_GUILD_ID=your_guild_id_here

# In Developer Portal → Your App → General Information
DISCORD_CLIENT_ID=your_client_id_here
```

### Invite Bot to Server
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

## Step 2: Supabase Setup (10 min)

### Create Project
1. Go to https://supabase.com
2. Create new project (free tier)
3. Save your project URL and anon key

### Run Database Migration
```sql
-- Copy the schema from ARCHITECTURE.md
-- Run in Supabase SQL Editor

-- Start with core tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    discord_username VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    streak_count INTEGER DEFAULT 0,
    total_practice_minutes INTEGER DEFAULT 0
);

CREATE TABLE hacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 5,
    category VARCHAR(100) DEFAULT 'basic',
    level INTEGER DEFAULT 1
);

-- Insert starter hacks
INSERT INTO hacks (name, slug, description, duration_minutes) VALUES
('Energy Ball', 'energy-ball', 'Feel bio-electricity between your palms', 5),
('Eye Massage', 'eye-massage', 'Instant relief for screen strain', 3),
('Warm Liquid', 'warm-liquid', 'Deep relaxation technique', 10),
('Double Torus Shield', 'shield', 'Create permanent energy protection', 20);

CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hack_id UUID REFERENCES hacks(id),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Step 3: Bot Setup (5 min)

### Initialize Project
```bash
# Create bot directory
mkdir nrgbot && cd nrgbot

# Initialize npm project
npm init -y

# Install dependencies
npm install discord.js @supabase/supabase-js dotenv
npm install -D typescript @types/node tsx nodemon

# Initialize TypeScript
npx tsc --init
```

### Create .env File
```bash
# .env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
```

### Create Basic Bot (src/index.ts)
```typescript
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

// Bot ready event
client.once(Events.ClientReady, c => {
    console.log(`✅ Bot logged in as ${c.user.tag}`);
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'checkin') {
        await handleCheckin(interaction);
    }
});

async function handleCheckin(interaction: any) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    // Get or create user
    let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('discord_id', userId)
        .single();
    
    if (!user) {
        const { data: newUser } = await supabase
            .from('users')
            .insert({
                discord_id: userId,
                discord_username: username
            })
            .select()
            .single();
        user = newUser;
    }
    
    // Update streak
    const { data: updated } = await supabase
        .from('users')
        .update({ 
            streak_count: (user.streak_count || 0) + 1,
            last_checkin: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
    
    await interaction.reply({
        content: `✨ Practice recorded!\nStreak: ${updated.streak_count} days 🔥`,
        ephemeral: false
    });
}

// Login bot
client.login(process.env.DISCORD_TOKEN);
```

### Register Commands (src/deploy-commands.ts)
```typescript
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    {
        name: 'checkin',
        description: 'Record your daily practice',
    },
    {
        name: 'streak',
        description: 'View your current streak',
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.DISCORD_CLIENT_ID!,
                process.env.DISCORD_GUILD_ID!
            ),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
```

### Update package.json Scripts
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "deploy-commands": "tsx src/deploy-commands.ts"
  }
}
```

---

## Step 4: Run the Bot (5 min)

```bash
# Deploy commands to Discord
npm run deploy-commands

# Start bot in development mode
npm run dev

# You should see:
# ✅ Bot logged in as NRGHAX Bot#1234
```

### Test in Discord
```
/checkin
# Bot responds: ✨ Practice recorded! Streak: 1 days 🔥
```

---

## Step 5: Next Features to Add

### Priority 1: Streak Command
```typescript
if (interaction.commandName === 'streak') {
    const { data: user } = await supabase
        .from('users')
        .select('streak_count, total_practice_minutes')
        .eq('discord_id', interaction.user.id)
        .single();
    
    await interaction.reply(
        `🔥 Your streak: ${user?.streak_count || 0} days\n` +
        `⏱️ Total practice: ${user?.total_practice_minutes || 0} minutes`
    );
}
```

### Priority 2: Practice Tracking
```typescript
// Add hack selection to checkin
{
    name: 'checkin',
    description: 'Record your daily practice',
    options: [
        {
            name: 'technique',
            type: 3, // STRING
            description: 'What did you practice?',
            choices: [
                { name: 'Energy Ball', value: 'energy-ball' },
                { name: 'Shield', value: 'shield' },
                { name: 'Eye Massage', value: 'eye-massage' }
            ]
        },
        {
            name: 'minutes',
            type: 4, // INTEGER
            description: 'How long did you practice?'
        }
    ]
}
```

### Priority 3: Validation System
```typescript
if (interaction.commandName === 'validate') {
    const targetUser = interaction.options.getUser('user');
    // Add validation logic
}
```

---

## 📁 Minimal File Structure

```
nrgbot/
├── src/
│   ├── index.ts           # Main bot file
│   ├── deploy-commands.ts # Command registration
│   └── commands/          # Command handlers (as you grow)
├── .env                   # Environment variables
├── .gitignore            # Include .env
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

---

## 🚨 Common Issues & Solutions

### Bot Not Responding
- Check bot is online in Discord
- Verify token is correct
- Ensure intents are enabled
- Check bot has permissions in channel

### Commands Not Showing
- Run deploy-commands script
- Wait 1-2 minutes for Discord cache
- Try refreshing Discord (Ctrl+R)
- Check guild ID is correct

### Database Errors
- Verify Supabase URL and key
- Check table names match exactly
- Ensure RLS is disabled for testing
- Check network connectivity

### TypeScript Errors
```bash
# Quick fixes
npm install @types/node
npm install --save-dev typescript

# If imports fail
tsconfig.json: "esModuleInterop": true
```

---

## 🎯 First Week Goals

### Day 1-2: Core Setup
- ✅ Bot responds to commands
- ✅ Database connection works
- ✅ Basic checkin/streak

### Day 3-4: Practice Features
- Add technique selection
- Add duration tracking
- Create practice sessions table

### Day 5-7: Social Features
- Implement validation
- Add practice announcements
- Create first achievement

---

## 📚 Resources

### Documentation
- [Discord.js Guide](https://discordjs.guide/)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Example Repos
- [Discord.js Examples](https://github.com/discordjs/discord.js/tree/main/packages/discord.js/examples)
- [Supabase + Discord](https://github.com/supabase/supabase/tree/master/examples)

### Community Help
- Discord.js Server: https://discord.gg/djs
- Supabase Discord: https://discord.supabase.com

---

## 🚀 Deployment Options

### Option 1: Railway (Easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Option 2: Render
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Option 3: VPS (Most Control)
```bash
# On your VPS
git clone your-repo
npm install
npm run build
pm2 start dist/index.js
```

---

## 💡 Pro Tips

1. **Start Simple**: Get /checkin working before complex features
2. **Test Often**: Use a test Discord server
3. **Log Everything**: Good logging saves hours of debugging
4. **Version Control**: Commit working code frequently
5. **Ask for Help**: Discord.js community is very helpful

---

## 🎉 You're Ready!

You now have:
- ✅ Working Discord bot
- ✅ Database connection
- ✅ Basic commands
- ✅ Clear path forward

Remember the philosophy:
**Success = Users who no longer need us**

Build for liberation, not retention! 🚀