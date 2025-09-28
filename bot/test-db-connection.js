const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  // Check for environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SECRET_KEY:', process.env.SUPABASE_SECRET_KEY ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log('   URL:', supabaseUrl);
  console.log('   Key type:', process.env.SUPABASE_SECRET_KEY ? 'SUPABASE_SECRET_KEY' : 'SUPABASE_SERVICE_ROLE_KEY');
  console.log();

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test 1: Count hacks
    console.log('📊 Test 1: Counting hacks...');
    const { count: hackCount, error: hackError } = await supabase
      .from('hacks')
      .select('*', { count: 'exact', head: true });

    if (hackError) {
      console.error('❌ Error counting hacks:', hackError.message);
    } else {
      console.log(`✅ Found ${hackCount} hacks in database`);
    }

    // Test 2: Get sample hacks
    console.log('\n📊 Test 2: Fetching sample hacks...');
    const { data: hacks, error: fetchError } = await supabase
      .from('hacks')
      .select('id, name, category, is_published')
      .limit(3);

    if (fetchError) {
      console.error('❌ Error fetching hacks:', fetchError.message);
    } else {
      console.log(`✅ Successfully fetched ${hacks.length} sample hacks:`);
      hacks.forEach(hack => {
        console.log(`   - ${hack.name} (${hack.category || 'No category'}) ${hack.is_published ? '✅' : '❌'}`);
      });
    }

    // Test 3: Count profiles
    console.log('\n📊 Test 3: Counting profiles...');
    const { count: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profileError) {
      console.error('❌ Error counting profiles:', profileError.message);
    } else {
      console.log(`✅ Found ${profileCount} profiles in database`);
    }

    // Test 4: Check routines table
    console.log('\n📊 Test 4: Checking routines...');
    const { count: routineCount, error: routineError } = await supabase
      .from('routines')
      .select('*', { count: 'exact', head: true });

    if (routineError) {
      console.error('❌ Error counting routines:', routineError.message);
    } else {
      console.log(`✅ Found ${routineCount} routines in database`);
    }

    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error);