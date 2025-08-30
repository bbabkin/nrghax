// Authentication-related type definitions for Supabase Auth

// User role types
export type UserRole = 'user' | 'admin' | 'super_admin';

// User profile from database
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Legacy User interface (for backward compatibility)
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role?: UserRole;
}

// Auth error interface
export interface AuthError {
  message: string;
  code?: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration credentials
export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Auth session (Supabase format)
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: any;
    app_metadata?: any;
  };
}

// Supported auth providers
export type AuthProvider = 'email' | 'google' | 'discord';

// Auth context type for React context
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ error?: AuthError }>;
  signUp: (credentials: RegisterCredentials) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
  resetPassword: (request: PasswordResetRequest) => Promise<{ error?: AuthError }>;
  signInWithOAuth: (provider: 'google' | 'discord') => Promise<{ error?: AuthError }>;
}

// Role permissions helper types
export interface RolePermissions {
  canViewAdminPanel: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canChangeUserRoles: boolean;
  canDeleteUsers: boolean;
}

// Auth response types
export interface AuthResponse {
  user?: UserProfile;
  session?: AuthSession;
  error?: AuthError;
}

// OAuth redirect configuration
export interface OAuthConfig {
  redirectTo?: string;
  scopes?: string;
}

// Session configuration
export interface SessionConfig {
  duration: number; // in seconds (30 days = 2592000)
  autoRefresh: boolean;
  persistSession: boolean;
}