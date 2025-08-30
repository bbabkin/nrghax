import { supabaseAdmin } from './supabase'
import { hashPassword, passwordSchema, emailSchema } from './auth'
import { z } from 'zod'

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
)

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
)

// User registration function
export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(data)
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', (validatedData.email as string).toLowerCase())
      .single()
    
    if (existingUser) {
      return { 
        success: false, 
        error: 'User with this email already exists' 
      }
    }
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is what we want
      console.error('Error checking existing user:', checkError)
      return { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Generate user ID
    const userId = crypto.randomUUID()
    
    // Create user profile
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: (validatedData.email as string).toLowerCase(),
        name: (validatedData.name as string) || null,
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, email, name')
      .single()
    
    if (createError) {
      console.error('Error creating user:', createError)
      return { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      }
    }
    
    return { 
      success: true, 
      user: newUser 
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed",
        fieldErrors: error.errors.reduce((acc, err) => {
          const path = err.path[0]
          if (path) {
            acc[path as string] = err.message
          }
          return acc
        }, {} as Record<string, string>)
      }
    }
    
    console.error('Registration error:', error)
    return { 
      success: false, 
      error: 'Registration failed. Please try again.' 
    }
  }
}

// Password reset token generation
export async function generatePasswordResetToken(email: string) {
  try {
    // Validate email
    const validatedEmail = emailSchema.parse(email.toLowerCase())
    
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name')
      .eq('email', validatedEmail)
      .single()
    
    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return { 
        success: true, 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      }
    }
    
    // Generate reset token (32 random bytes as hex)
    const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    
    // Store reset token (in production, use a separate password_reset_tokens table)
    // For now, we'll use a simple approach with the user_profiles table
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Error storing reset token:', updateError)
      return { 
        success: false, 
        error: 'Failed to generate password reset token.' 
      }
    }
    
    // In production, send email here
    console.log(`Password reset token for ${user.email}: ${resetToken}`)
    
    return { 
      success: true, 
      message: 'If an account with this email exists, a password reset link has been sent.',
      // Remove token from response in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed" 
      }
    }
    
    console.error('Password reset token generation error:', error)
    return { 
      success: false, 
      error: 'Failed to generate password reset token.' 
    }
  }
}

// Password reset function
export async function resetPassword(data: z.infer<typeof passwordResetSchema>) {
  try {
    // Validate input
    const validatedData = passwordResetSchema.parse(data)
    
    // Find user by reset token
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, reset_token_expires_at')
      .eq('reset_token', validatedData.token)
      .single()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Invalid or expired reset token.' 
      }
    }
    
    // Check if token is expired
    if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
      return { 
        success: false, 
        error: 'Reset token has expired.' 
      }
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Error updating password:', updateError)
      return { 
        success: false, 
        error: 'Failed to update password. Please try again.' 
      }
    }
    
    return { 
      success: true, 
      message: 'Password has been successfully reset.' 
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed",
        fieldErrors: error.errors.reduce((acc, err) => {
          const path = err.path[0]
          if (path) {
            acc[path as string] = err.message
          }
          return acc
        }, {} as Record<string, string>)
      }
    }
    
    console.error('Password reset error:', error)
    return { 
      success: false, 
      error: 'Failed to reset password. Please try again.' 
    }
  }
}

// Change password function (for authenticated users)
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    // Validate new password
    passwordSchema.parse(newPassword)
    
    // Get user's current password hash
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('password_hash')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'User not found.' 
      }
    }
    
    if (!user.password_hash) {
      return { 
        success: false, 
        error: 'Cannot change password for OAuth accounts.' 
      }
    }
    
    // Verify current password
    const bcrypt = await import('bcryptjs')
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    
    if (!isCurrentPasswordValid) {
      return { 
        success: false, 
        error: 'Current password is incorrect.' 
      }
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword)
    
    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Error updating password:', updateError)
      return { 
        success: false, 
        error: 'Failed to change password. Please try again.' 
      }
    }
    
    return { 
      success: true, 
      message: 'Password has been successfully changed.' 
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed" 
      }
    }
    
    console.error('Change password error:', error)
    return { 
      success: false, 
      error: 'Failed to change password. Please try again.' 
    }
  }
}

// Export types
export type RegisterData = z.infer<typeof registerSchema>
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetData = z.infer<typeof passwordResetSchema>