import { NextRequest, NextResponse } from "next/server"
import { generatePasswordResetToken, resetPassword, passwordResetRequestSchema, passwordResetSchema } from "@/lib/auth-utils"
import { withRateLimit, getRequestIdentifier, checkRateLimit } from "@/lib/rate-limiting"

// POST /api/auth/reset-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'request') {
      // Password reset request
      const identifier = getRequestIdentifier(request)
      
      // Check rate limit
      const rateLimitResult = checkRateLimit(identifier, 'PASSWORD_RESET')
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: rateLimitResult.error || 'Too many password reset requests. Please try again later.',
            rateLimitExceeded: true,
            resetTime: rateLimitResult.resetTime
          },
          { status: 429 }
        )
      }
      
      // Validate input
      const result = passwordResetRequestSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error.errors[0]?.message || "Validation failed"
          },
          { status: 400 }
        )
      }
      
      // Check rate limit by email as well
      const emailIdentifier = getRequestIdentifier(request, result.data.email as string)
      const emailRateLimitResult = checkRateLimit(emailIdentifier, 'PASSWORD_RESET')
      if (!emailRateLimitResult.allowed) {
        return NextResponse.json(
          { 
            success: true, // Don't reveal if email exists for security
            message: 'If an account with this email exists, a password reset link has been sent.'
          },
          { status: 200 }
        )
      }
      
      // Generate reset token
      const resetResult = await generatePasswordResetToken(result.data.email as string)
      
      return NextResponse.json(resetResult, { 
        status: resetResult.success ? 200 : 400 
      })
      
    } else if (action === 'reset') {
      // Password reset with token
      
      // Validate input
      const result = passwordResetSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error.errors[0]?.message || "Validation failed",
            fieldErrors: result.error.errors.reduce((acc, err) => {
              const path = err.path[0]
              if (path) {
                acc[path as string] = err.message
              }
              return acc
            }, {} as Record<string, string>)
          },
          { status: 400 }
        )
      }
      
      // Reset password
      const resetResult = await resetPassword(result.data)
      
      return NextResponse.json(resetResult, { 
        status: resetResult.success ? 200 : 400 
      })
      
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Use "request" or "reset".' 
        },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Password reset API error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Password reset failed. Please try again.' 
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

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