import { supabaseAdmin } from './supabase'
import { emailSchema } from './auth'
import { z } from 'zod'

// Email verification request schema
export const emailVerificationRequestSchema = z.object({
  email: emailSchema,
})

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
})

/**
 * Generate email verification token for a user
 */
export async function generateEmailVerificationToken(email: string) {
  try {
    // Validate email
    const validatedEmail = emailSchema.parse(email.toLowerCase())
    
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, email_verified')
      .eq('email', validatedEmail)
      .single()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'User not found.' 
      }
    }
    
    // Check if already verified
    if (user.email_verified) {
      return { 
        success: false, 
        error: 'Email is already verified.' 
      }
    }
    
    // Generate verification token (32 random bytes as hex)
    const verificationToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Token expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    // Store verification token
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        verification_token: verificationToken,
        verification_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Error storing verification token:', updateError)
      return { 
        success: false, 
        error: 'Failed to generate email verification token.' 
      }
    }
    
    // In production, send email here
    console.log(`Email verification token for ${user.email}: ${verificationToken}`)
    console.log(`Verification URL: ${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`)
    
    return { 
      success: true, 
      message: 'Verification email has been sent.',
      // Remove token from response in production
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed" 
      }
    }
    
    console.error('Email verification token generation error:', error)
    return { 
      success: false, 
      error: 'Failed to generate email verification token.' 
    }
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string) {
  try {
    // Validate input
    const validatedData = emailVerificationSchema.parse({ token })
    
    // Find user by verification token
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, email_verified, verification_token_expires_at')
      .eq('verification_token', validatedData.token)
      .single()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Invalid or expired verification token.' 
      }
    }
    
    // Check if already verified
    if (user.email_verified) {
      return { 
        success: true, 
        message: 'Email is already verified.',
        alreadyVerified: true
      }
    }
    
    // Check if token is expired
    if (!user.verification_token_expires_at || new Date(user.verification_token_expires_at) < new Date()) {
      return { 
        success: false, 
        error: 'Verification token has expired. Please request a new one.' 
      }
    }
    
    // Verify email and clear verification token
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Error verifying email:', updateError)
      return { 
        success: false, 
        error: 'Failed to verify email. Please try again.' 
      }
    }
    
    return { 
      success: true, 
      message: 'Email has been successfully verified.' 
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed" 
      }
    }
    
    console.error('Email verification error:', error)
    return { 
      success: false, 
      error: 'Failed to verify email. Please try again.' 
    }
  }
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('email_verified')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return false
    }
    
    return user.email_verified || false
  } catch (error) {
    console.error('Error checking email verification:', error)
    return false
  }
}

/**
 * Resend verification email (with rate limiting)
 */
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>()

export async function resendVerificationEmail(email: string) {
  try {
    // Validate email
    const validatedEmail = emailSchema.parse(email.toLowerCase())
    
    // Rate limiting - max 3 attempts per hour
    const now = Date.now()
    const attempts = resendAttempts.get(validatedEmail)
    const maxAttempts = 3
    const windowMs = 60 * 60 * 1000 // 1 hour
    
    if (attempts) {
      // Reset if window has passed
      if (now - attempts.lastAttempt > windowMs) {
        resendAttempts.set(validatedEmail, { count: 1, lastAttempt: now })
      } else if (attempts.count >= maxAttempts) {
        return {
          success: false,
          error: 'Too many verification emails sent. Please wait before requesting another.'
        }
      } else {
        resendAttempts.set(validatedEmail, { count: attempts.count + 1, lastAttempt: now })
      }
    } else {
      resendAttempts.set(validatedEmail, { count: 1, lastAttempt: now })
    }
    
    // Generate and send verification token
    return await generateEmailVerificationToken(validatedEmail)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed" 
      }
    }
    
    console.error('Resend verification email error:', error)
    return { 
      success: false, 
      error: 'Failed to resend verification email.' 
    }
  }
}

// Export types
export type EmailVerificationRequestData = z.infer<typeof emailVerificationRequestSchema>
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>