import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=Could not authenticate user`,
      {
        status: 301,
      }
    )
  }

  // JIT Sync: Create profile immediately for new signup
  if (data.user) {
    try {
      await prisma.profile.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          isAdmin: false,
        }
      })
      console.log('Profile created for new user:', email)
    } catch (profileError) {
      console.error('Failed to create profile:', profileError)
      // Don't fail signup, profile will be created on first login
    }
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/auth?message=Check email to continue sign in process`,
    {
      status: 301,
    }
  )
}