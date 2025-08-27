// Authentication-related type definitions

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface AuthSession {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

export type AuthProvider = 'email' | 'google'

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<{ error?: AuthError }>
  signUp: (credentials: RegisterCredentials) => Promise<{ error?: AuthError }>
  signOut: () => Promise<void>
  resetPassword: (request: PasswordResetRequest) => Promise<{ error?: AuthError }>
}