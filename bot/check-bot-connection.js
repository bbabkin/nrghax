// Script to verify bot connection and configuration
const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

console.log('🔍 Bot Connection Checker\n');
console.log('═══════════════════════════════════════════\n');

// 1. Check environment variables
console.log('1️⃣ Environment Variables Check:');
console.log('--------------------------------');
if (process.env.DISCORD_TOKEN) {
  const tokenPreview = process.env.DISCORD_TOKEN.substring(0, 20) + '...';
  console.log(`✅ DISCORD_TOKEN: ${tokenPreview}`);
} else {
  console.log('❌ DISCORD_TOKEN: Missing!');
}

if (process.env.SUPABASE_URL) {
  console.log(`✅ SUPABASE_URL: ${process.env.SUPABASE_URL}`);
} else {
  console.log('❌ SUPABASE_URL: Missing!');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const keyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...';
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${keyPreview}`);
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY: Missing!');
}

console.log(`✅ APP_URL: ${process.env.APP_URL || 'http://localhost:3000'}`);

// 2. Test Supabase connection
console.log('\n2️⃣ Supabase Connection Test:');
console.log('--------------------------------');
async function testSupabase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await supabase
      .from('hacks')
      .select('count')
      .single();

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected successfully!');
      const { count } = await supabase
        .from('hacks')
        .select('*', { count: 'exact', head: true });
      console.log(`   Found ${count || 0} hacks in database`);
    }
  } catch (err) {
    console.log('❌ Supabase error:', err.message);
  }
}

// 3. Test Discord bot connection
console.log('\n3️⃣ Discord Bot Connection Test:');
console.log('--------------------------------');
async function testDiscord() {
  if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'TEST_TOKEN_FOR_VERIFICATION') {
    console.log('⚠️  No valid Discord token provided');
    console.log('   Add your bot token to bot/.env');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ]
  });

  client.once('ready', () => {
    console.log('✅ Bot connected to Discord!');
    console.log(`   Bot Username: ${client.user.tag}`);
    console.log(`   Bot ID: ${client.user.id}`);
    console.log(`   Connected to ${client.guilds.cache.size} server(s)`);

    // List servers
    if (client.guilds.cache.size > 0) {
      console.log('\n   Servers:');
      client.guilds.cache.forEach(guild => {
        console.log(`   - ${guild.name} (${guild.id})`);
      });
    }

    client.destroy();
    process.exit(0);
  });

  client.on('error', (error) => {
    console.log('❌ Discord connection error:', error.message);
    process.exit(1);
  });

  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.log('❌ Failed to login:', error.message);
    console.log('   Check if your token is valid');
    process.exit(1);
  }
}

// Run tests
testSupabase().then(() => {
  testDiscord();
});