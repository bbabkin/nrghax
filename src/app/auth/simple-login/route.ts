import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

// Hardcoded test user for demonstration
const TEST_USER = {
  email: 'test@test.com',
  password_hash: '$2b$10$rANf/NkHI7Ll0UDRVl8djeQXAIv0K.PN97t5FgpuKxdj/YY5UtLR2', // test123
  id: 'a0000000-0000-0000-0000-000000000001',
  full_name: 'Test Admin',
  is_admin: true
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  
  console.log('Simple login attempt for:', email)
  
  try {
    // Check if it's our test user
    if (email !== TEST_USER.email) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, TEST_USER.password_hash)
    
    if (!passwordMatch) {
      console.log('Password mismatch for:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Create a simple session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-session', JSON.stringify({
      user_id: TEST_USER.id,
      email: TEST_USER.email,
      full_name: TEST_USER.full_name,
      is_admin: TEST_USER.is_admin
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    
    console.log('Simple login successful for:', email)
    
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`, {
      status: 301,
    })
  } catch (error: any) {
    console.error('Unexpected error during simple login:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}