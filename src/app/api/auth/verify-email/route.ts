import { NextRequest, NextResponse } from "next/server"
import { verifyEmail, generateEmailVerificationToken, resendVerificationEmail, emailVerificationSchema, emailVerificationRequestSchema } from "@/lib/email-verification"
import { withRateLimit, getRequestIdentifier, checkRateLimit } from "@/lib/rate-limiting"

// POST /api/auth/verify-email - Verify email or resend verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'verify') {
      // Email verification with token
      const identifier = getRequestIdentifier(request)
      
      // Check rate limit
      const rateLimitResult = checkRateLimit(identifier, 'EMAIL_VERIFICATION')
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: rateLimitResult.error || 'Too many verification attempts. Please try again later.',
            rateLimitExceeded: true,
            resetTime: rateLimitResult.resetTime
          },
          { status: 429 }
        )
      }
      
      // Validate input
      const result = emailVerificationSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error.errors[0]?.message || "Validation failed"
          },
          { status: 400 }
        )
      }
      
      // Verify email
      const verificationResult = await verifyEmail(result.data.token)
      
      return NextResponse.json(verificationResult, { 
        status: verificationResult.success ? 200 : 400 
      })
      
    } else if (action === 'resend') {
      // Resend verification email
      const identifier = getRequestIdentifier(request)
      
      // Check rate limit
      const rateLimitResult = checkRateLimit(identifier, 'EMAIL_VERIFICATION')
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: rateLimitResult.error || 'Too many verification requests. Please try again later.',
            rateLimitExceeded: true,
            resetTime: rateLimitResult.resetTime
          },
          { status: 429 }
        )
      }
      
      // Validate input
      const result = emailVerificationRequestSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error.errors[0]?.message || "Validation failed"
          },
          { status: 400 }
        )
      }
      
      // Additional rate limit by email
      const emailIdentifier = getRequestIdentifier(request, result.data.email)
      const emailRateLimitResult = checkRateLimit(emailIdentifier, 'EMAIL_VERIFICATION')
      if (!emailRateLimitResult.allowed) {
        return NextResponse.json(
          { 
            success: false,
            error: emailRateLimitResult.error || 'Too many verification emails sent to this address. Please try again later.',
            rateLimitExceeded: true,
            resetTime: emailRateLimitResult.resetTime
          },
          { status: 429 }
        )
      }
      
      // Resend verification email
      const resendResult = await resendVerificationEmail(result.data.email)
      
      return NextResponse.json(resendResult, { 
        status: resendResult.success ? 200 : 400 
      })
      
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Use "verify" or "resend".' 
        },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Email verification API error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email verification failed. Please try again.' 
      },
      { status: 500 }
    )
  }
}

// GET /api/auth/verify-email?token=... - Verify email via URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification token is required' 
        },
        { status: 400 }
      )
    }
    
    // Rate limiting for GET requests too
    const identifier = getRequestIdentifier(request)
    const rateLimitResult = checkRateLimit(identifier, 'EMAIL_VERIFICATION')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Too many verification attempts. Please try again later.',
          rateLimitExceeded: true,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      )
    }
    
    // Verify email
    const verificationResult = await verifyEmail(token)
    
    return NextResponse.json(verificationResult, { 
      status: verificationResult.success ? 200 : 400 
    })
    
  } catch (error) {
    console.error('Email verification GET API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email verification failed. Please try again.' 
      },
      { status: 500 }
    )
  }
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