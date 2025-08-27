import { NextRequest, NextResponse } from "next/server"
import { registerUser, registerSchema } from "@/lib/auth-utils"
import { withRateLimit, getRequestIdentifier, resetRateLimit } from "@/lib/rate-limiting"
import { z } from "zod"

const registrationHandler = async (request: NextRequest) => {
  try {
    // Parse request body with error handling
    let body
    try {
      const text = await request.text()
      if (!text) {
        throw new Error('Empty request body')
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }
    
    // Validate input
    const result = registerSchema.safeParse(body)
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
    
    // Register user
    const registrationResult = await registerUser(result.data)
    
    // Reset rate limit on successful registration
    if (registrationResult.success) {
      const identifier = getRequestIdentifier(request, result.data.email)
      resetRateLimit(identifier, 'REGISTRATION')
    }
    
    return NextResponse.json(
      registrationResult,
      { status: registrationResult.success ? 201 : 400 }
    )
    
  } catch (error) {
    console.error('Registration API error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      },
      { status: 500 }
    )
  }
}

// Apply rate limiting to the registration handler
export const POST = withRateLimit('REGISTRATION', registrationHandler, {
  getUserIdentifier: (request: NextRequest) => {
    // Try to get email from request body for more specific rate limiting
    try {
      // Note: This is async in reality, but for rate limiting we use a simpler approach
      return undefined // Let it use IP-based rate limiting
    } catch {
      return undefined
    }
  }
})

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