import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Secure logout functionality
export async function POST(request: NextRequest) {
  try {
    // Get the cookies instance
    const cookieStore = cookies()
    
    // Define all possible NextAuth cookie names to clear
    const cookieNames = [
      '__Secure-next-auth.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.callback-url',
      'next-auth.callback-url',
      '__Host-next-auth.csrf-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.pkce.code_verifier',
      'next-auth.pkce.code_verifier',
    ]
    
    // Clear all authentication cookies
    cookieNames.forEach(name => {
      try {
        cookieStore.delete({
          name,
          path: '/',
          domain: undefined,
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax',
        })
      } catch (error) {
        // Cookie might not exist, which is fine
        console.debug(`Cookie ${name} not found during logout`, error)
      }
    })
    
    // Create response with additional security headers
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Successfully logged out' 
      },
      { status: 200 }
    )
    
    // Set explicit cookie clearing headers for additional security
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        path: '/',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
      })
    })
    
    // Add security headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error('Logout API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Logout failed. Please try again.' 
      },
      { status: 500 }
    )
  }
}

// GET method for logout (for cases where POST isn't available)
export async function GET(request: NextRequest) {
  return POST(request)
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}