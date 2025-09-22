import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetOnboarding(email: string) {
  console.log(`🔄 Resetting onboarding for ${email}...`);

  try {
    // Get user by email
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email);

    if (!users || users.length === 0) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    const userId = users[0].id;

    // Clear onboarding tags
    const { error: tagError } = await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId)
      .eq('source', 'onboarding');

    if (tagError) {
      console.error('Error clearing tags:', tagError);
    } else {
      console.log('✅ Cleared onboarding tags');
    }

    // Reset onboarded flag in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarded: false })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('✅ Reset onboarded flag');
    }

    console.log('✨ Onboarding reset complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'user@nrghax.com';

resetOnboarding(email).then(() => {
  process.exit(0);
});