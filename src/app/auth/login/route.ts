import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  console.log('Login attempt for:', email)

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)

      // Return specific error messages
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please try again.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      )
    }

    // JIT Sync: Ensure profile exists
    await prisma.profile.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email!,
        updatedAt: new Date(),
      },
      create: {
        id: data.user.id,
        email: data.user.email!,
        fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatarUrl: data.user.user_metadata?.avatar_url,
        isAdmin: false,
      }
    })

    console.log('Login successful for:', email)
    
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`, {
      status: 301,
    })
  } catch (error: any) {
    console.error('Unexpected error during login:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}