import { NextRequest, NextResponse } from "next/server"
import { changePassword } from "@/lib/auth-utils"
import { withAuth } from "@/lib/session-utils"
import { withRateLimit, getRequestIdentifier } from "@/lib/rate-limiting"
import { z } from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  }
)

const changePasswordHandler = withAuth(async (session, request: NextRequest) => {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const result = changePasswordSchema.safeParse(body)
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
    
    // Change password
    const changeResult = await changePassword(
      session.user.id,
      result.data.currentPassword,
      result.data.newPassword
    )
    
    return NextResponse.json(
      changeResult,
      { status: changeResult.success ? 200 : 400 }
    )
    
  } catch (error) {
    console.error('Change password API error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Password change failed. Please try again.' 
      },
      { status: 500 }
    )
  }
})

// Apply rate limiting to password change
export const POST = withRateLimit('CHANGE_PASSWORD', changePasswordHandler, {
  getUserIdentifier: (request: NextRequest) => {
    // Note: Can't access session here since rate limiting runs before auth
    // Use IP-based rate limiting for now
    return undefined
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