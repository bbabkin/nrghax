// Minimal auth.ts to satisfy legacy imports
import bcryptjs from 'bcryptjs'
import { z } from 'zod'

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

// Placeholder auth function for compatibility
export function auth() {
  console.warn('auth() function called but NextAuth is not configured')
  return null
}

// Placeholder handlers for compatibility
export const handlers = {
  GET: () => new Response('Not implemented', { status: 501 }),
  POST: () => new Response('Not implemented', { status: 501 }),
}

// Placeholder signIn/signOut for compatibility
export function signIn() {
  throw new Error('signIn not implemented - use Supabase auth')
}

export function signOut() {
  throw new Error('signOut not implemented - use Supabase auth')
}

// Placeholder getServerSession for compatibility
export function getServerSession() {
  console.warn('getServerSession called but should use Supabase server client')
  return null
}