#!/usr/bin/env node

/**
 * Production Database Test Script
 * Tests actual database functions against production Supabase
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Test connection before initializing client
async function testConnection() {
  return new Promise((resolve) => {
    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const url = new URL(dbUrl);
    https.get({
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'HEAD',
      timeout: 5000
    }, (res) => {
      resolve(res.statusCode < 500);
    }).on('error', (err) => {
      console.log(`Connection test failed: ${err.message}`);
      resolve(false);
    }).on('timeout', () => {
      console.log('Connection test timed out');
      resolve(false);
    });
  });
}

// Initialize Supabase client with production credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: require('node-fetch'),
    }
  }
);

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testFetchHacks() {
  log('\n📚 Testing: Fetch All Hacks', colors.cyan);

  try {
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    log(`✅ Successfully fetched ${hacks?.length || 0} hacks`, colors.green);

    if (hacks && hacks.length > 0) {
      log('\n  Sample hack:', colors.yellow);
      const hack = hacks[0];
      log(`    ID: ${hack.id}`, colors.reset);
      log(`    Name: ${hack.name}`, colors.reset);
      log(`    Category: ${hack.category || 'N/A'}`, colors.reset);
      log(`    Created: ${new Date(hack.created_at).toLocaleDateString()}`, colors.reset);
    }

    return true;
  } catch (error) {
    log(`❌ Error fetching hacks: ${error.message}`, colors.red);
    return false;
  }
}

async function testSearchHacks(query) {
  log(`\n🔍 Testing: Search Hacks with query "${query}"`, colors.cyan);

  try {
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(3);

    if (error) throw error;

    log(`✅ Found ${hacks?.length || 0} hacks matching "${query}"`, colors.green);

    if (hacks && hacks.length > 0) {
      hacks.forEach((hack, index) => {
        log(`\n  Result ${index + 1}:`, colors.yellow);
        log(`    Name: ${hack.name}`, colors.reset);
        log(`    Match in: ${hack.name.toLowerCase().includes(query.toLowerCase()) ? 'name' : 'description'}`, colors.reset);
      });
    }

    return true;
  } catch (error) {
    log(`❌ Error searching hacks: ${error.message}`, colors.red);
    return false;
  }
}

async function testFetchByCategory(category) {
  log(`\n📁 Testing: Fetch Hacks by Category "${category}"`, colors.cyan);

  try {
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    log(`✅ Found ${hacks?.length || 0} hacks in category "${category}"`, colors.green);

    if (hacks && hacks.length > 0) {
      hacks.forEach((hack, index) => {
        log(`\n  ${index + 1}. ${hack.name}`, colors.yellow);
        log(`     Created: ${new Date(hack.created_at).toLocaleDateString()}`, colors.reset);
      });
    }

    return true;
  } catch (error) {
    log(`❌ Error fetching by category: ${error.message}`, colors.red);
    return false;
  }
}

async function testFetchProfiles() {
  log('\n👥 Testing: Fetch User Profiles', colors.cyan);

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (error) throw error;

    log(`✅ Successfully fetched ${profiles?.length || 0} profiles`, colors.green);

    if (profiles && profiles.length > 0) {
      log('\n  Sample profile:', colors.yellow);
      const profile = profiles[0];
      log(`    ID: ${profile.id}`, colors.reset);
      log(`    Discord ID: ${profile.discord_id || 'N/A'}`, colors.reset);
      log(`    Created: ${new Date(profile.created_at).toLocaleDateString()}`, colors.reset);
    }

    return true;
  } catch (error) {
    log(`❌ Error fetching profiles: ${error.message}`, colors.red);
    return false;
  }
}

async function testFetchUserHacks() {
  log('\n🎯 Testing: Fetch User Hacks with Joins', colors.cyan);

  try {
    const { data: userHacks, error } = await supabase
      .from('user_hacks')
      .select(`
        *,
        hacks (
          id,
          name,
          description,
          category
        )
      `)
      .limit(3);

    if (error) throw error;

    log(`✅ Successfully fetched ${userHacks?.length || 0} user hacks`, colors.green);

    if (userHacks && userHacks.length > 0) {
      userHacks.forEach((uh, index) => {
        log(`\n  User Hack ${index + 1}:`, colors.yellow);
        log(`    Status: ${uh.status}`, colors.reset);
        if (uh.hacks) {
          log(`    Hack: ${uh.hacks.name}`, colors.reset);
          log(`    Category: ${uh.hacks.category || 'N/A'}`, colors.reset);
        }
      });
    }

    return true;
  } catch (error) {
    log(`❌ Error fetching user hacks: ${error.message}`, colors.red);
    return false;
  }
}

async function testDatabaseStats() {
  log('\n📊 Testing: Database Statistics', colors.cyan);

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

    const { data: categories } = await supabase
      .from('hacks')
      .select('category')
      .not('category', 'is', null);

    const uniqueCategories = [...new Set(categories?.map(h => h.category) || [])];

    log('✅ Database Statistics:', colors.green);
    log(`    Total Hacks: ${hackCount || 0}`, colors.reset);
    log(`    Total Profiles: ${profileCount || 0}`, colors.reset);
    log(`    Total User Hacks: ${userHackCount || 0}`, colors.reset);
    log(`    Unique Categories: ${uniqueCategories.length}`, colors.reset);

    if (uniqueCategories.length > 0) {
      log(`    Categories: ${uniqueCategories.slice(0, 5).join(', ')}${uniqueCategories.length > 5 ? '...' : ''}`, colors.reset);
    }

    return true;
  } catch (error) {
    log(`❌ Error fetching statistics: ${error.message}`, colors.red);
    return false;
  }
}

async function testRealTimeSubscription() {
  log('\n⚡ Testing: Real-time Subscription', colors.cyan);

  try {
    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hacks'
        },
        (payload) => {
          log(`  📨 Received real-time event: ${payload.eventType}`, colors.magenta);
        }
      );

    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        log('✅ Successfully subscribed to real-time updates', colors.green);

        // Unsubscribe after 2 seconds
        setTimeout(() => {
          supabase.removeChannel(channel);
          log('  Unsubscribed from real-time updates', colors.yellow);
        }, 2000);
      }
    });

    // Wait for subscription to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    return true;
  } catch (error) {
    log(`❌ Error with real-time subscription: ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('🧪 PRODUCTION DATABASE TEST SUITE', colors.blue);
  log('='.repeat(60), colors.blue);

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  log(`\n📍 Database: ${dbUrl}`, colors.reset);
  log(`🕐 Started: ${new Date().toLocaleString()}`, colors.reset);

  // Test connection first
  log('\n🔌 Testing connection...', colors.cyan);
  const isConnected = await testConnection();
  if (!isConnected) {
    log('❌ Could not connect to Supabase. Check network and credentials.', colors.red);
    process.exit(1);
  }
  log('✅ Connection successful', colors.green);

  const results = [];

  // Run all tests
  results.push({ name: 'Fetch All Hacks', passed: await testFetchHacks() });
  results.push({ name: 'Search Hacks', passed: await testSearchHacks('morning') });
  results.push({ name: 'Fetch by Category', passed: await testFetchByCategory('morning') });
  results.push({ name: 'Fetch Profiles', passed: await testFetchProfiles() });
  results.push({ name: 'Fetch User Hacks', passed: await testFetchUserHacks() });
  results.push({ name: 'Database Statistics', passed: await testDatabaseStats() });
  results.push({ name: 'Real-time Subscription', passed: await testRealTimeSubscription() });

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('📋 TEST RESULTS SUMMARY', colors.blue);
  log('='.repeat(60), colors.blue);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? colors.green : colors.red;
    log(`${icon} ${result.name}`, color);
  });

  log('\n' + '-'.repeat(60), colors.reset);
  log(`Total: ${results.length} tests | ✅ Passed: ${passed} | ❌ Failed: ${failed}`,
    failed === 0 ? colors.green : colors.yellow);

  if (failed === 0) {
    log('\n🎉 All tests passed successfully!', colors.green);
  } else {
    log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`, colors.yellow);
  }

  log(`\n🕐 Completed: ${new Date().toLocaleString()}`, colors.reset);
  log('='.repeat(60) + '\n', colors.blue);

  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});