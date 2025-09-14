const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminFeature() {
  console.log('Testing Admin Feature...\n')
  
  // 1. Sign up first user (should be admin)
  console.log('1. Creating first user (admin)...')
  const { data: admin, error: adminError } = await supabase.auth.signUp({
    email: 'admin@test.com',
    password: 'TestPassword123!',
  })
  
  if (adminError) {
    console.log('Admin user might already exist:', adminError.message)
  } else {
    console.log('Admin user created:', admin.user?.email)
  }
  
  // 2. Sign in as admin
  console.log('\n2. Signing in as admin...')
  const { data: adminSession, error: signinError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'TestPassword123!',
  })
  
  if (signinError) {
    console.error('Failed to sign in:', signinError.message)
    return
  }
  console.log('Signed in as:', adminSession.user?.email)
  
  // 3. Check admin status
  console.log('\n3. Checking admin status...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminSession.user.id)
    .single()
  
  if (profileError) {
    console.error('Failed to get profile:', profileError.message)
    return
  }
  console.log('Is admin:', profile.is_admin)
  
  // 4. Create a regular user
  console.log('\n4. Creating regular user...')
  const { data: regularUser, error: regularError } = await supabase.auth.signUp({
    email: 'user@test.com',
    password: 'TestPassword123!',
  })
  
  if (regularError) {
    console.log('Regular user might already exist:', regularError.message)
  } else {
    console.log('Regular user created:', regularUser.user?.email)
  }
  
  // 5. Sign in as admin again and fetch all users
  console.log('\n5. Fetching all users as admin...')
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (usersError) {
    console.error('Failed to fetch users:', usersError.message)
    return
  }
  
  console.log('Total users:', users.length)
  users.forEach(user => {
    console.log(`  - ${user.email} (Admin: ${user.is_admin})`)
  })
  
  console.log('\n✅ Admin feature test completed!')
  console.log('\nNow you can:')
  console.log('1. Visit http://localhost:3000')
  console.log('2. Sign in with admin@test.com / TestPassword123!')
  console.log('3. You should see "Users" in the navigation')
  console.log('4. Click on "Users" to see all registered users')
}

testAdminFeature().catch(console.error)