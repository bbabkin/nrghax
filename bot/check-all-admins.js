#!/usr/bin/env node

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

// Read admin emails from env
const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim())
  : ['bbabkin@gmail.com', 'boris@practiceenergy.com'];

async function updateAllAdmins() {
  console.log('🔍 Checking admin emails from config:', ADMIN_EMAILS);
  console.log('');

  for (const email of ADMIN_EMAILS) {
    console.log(`📧 Processing ${email}...`);

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error(`   ❌ Error finding ${email}:`, error.message);
      continue;
    }

    if (!user) {
      console.log(`   ⚠️  User ${email} not found in database`);
      continue;
    }

    console.log(`   Found user: ${user.name || 'No name'} (id: ${user.id})`);

    if (user.is_admin) {
      console.log(`   ✅ Already an admin`);
    } else {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error(`   ❌ Error updating:`, updateError.message);
      } else {
        console.log(`   ✅ Successfully set as admin`);
      }
    }
    console.log('');
  }

  // Show final admin list
  console.log('📋 Final admin status:');
  const { data: admins, error: listError } = await supabase
    .from('profiles')
    .select('email, name, is_admin')
    .eq('is_admin', true);

  if (listError) {
    console.error('Error listing admins:', listError.message);
  } else if (admins && admins.length > 0) {
    admins.forEach(admin => {
      console.log(`   ✅ ${admin.email} (${admin.name || 'No name'})`);
    });
  } else {
    console.log('   No admins found');
  }

  console.log('\n✨ Done!');
}

updateAllAdmins().catch(console.error);