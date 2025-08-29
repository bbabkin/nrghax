import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { checkRateLimit, resetRateLimit } from "./rate-limiting"

// Create Supabase client for NextAuth adapter
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables for NextAuth')
}

// Check for required NextAuth environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing required NEXTAUTH_SECRET environment variable')
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('Missing required NEXTAUTH_URL environment variable')
}

const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Add detailed logging for adapter errors
const originalConsoleError = console.error
console.error = (...args) => {
  if (args[0]?.includes?.('AdapterError') || args[0]?.includes?.('adapter_')) {
    console.log('🔍 DETAILED ADAPTER ERROR:', JSON.stringify(args, null, 2))
  }
  originalConsoleError.apply(console, args)
}

// Password validation schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

// Email validation schema
const emailSchema = z.string().email("Invalid email address")

// Helper function to hash passwords
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

// Helper function to verify passwords
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

// Create custom adapter with error logging
const customAdapter = SupabaseAdapter({
  url: supabaseUrl,
  secret: supabaseServiceRoleKey,
})

// Wrap adapter methods with error logging
const wrappedAdapter = {
  ...customAdapter,
  getUserByAccount: async (...args: any[]) => {
    console.log('🔍 getUserByAccount called with:', JSON.stringify(args, null, 2))
    try {
      const result = await customAdapter.getUserByAccount!(...(args as [any]))
      console.log('✅ getUserByAccount result:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.log('❌ getUserByAccount error:', error)
      throw error
    }
  },
  getSessionAndUser: async (...args: any[]) => {
    console.log('🔍 getSessionAndUser called with:', JSON.stringify(args, null, 2))
    try {
      const result = await customAdapter.getSessionAndUser!(...(args as [any]))
      console.log('✅ getSessionAndUser result:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.log('❌ getSessionAndUser error:', error)
      throw error
    }
  },
  createSession: async (...args: any[]) => {
    console.log('🔍 createSession called with:', JSON.stringify(args, null, 2))
    try {
      const result = await customAdapter.createSession!(...(args as [any]))
      console.log('✅ createSession result:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.log('❌ createSession error:', error)
      throw error
    }
  }
}

const config = {
  // adapter: wrappedAdapter, // Removed: Using JWT sessions instead of database sessions
  
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    
    // Email/Password Credentials Provider
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required")
          }
          
          // Validate email format
          const emailResult = emailSchema.safeParse(credentials.email)
          if (!emailResult.success) {
            throw new Error("Invalid email format")
          }
          
          const email = emailResult.data.toLowerCase()
          
          // Rate limiting - use centralized rate limiting
          const rateLimitResult = checkRateLimit(email, 'LOGIN')
          if (!rateLimitResult.allowed) {
            throw new Error(rateLimitResult.error || "Too many login attempts. Please try again later.")
          }
          
          // Query user from database using users table (NextAuth adapter table)
          const { data: user, error } = await supabaseClient
            .from('users')
            .select('id, email, name, role')
            .eq('email', email)
            .single()
          
          // If user not found in users table, check user_profiles for credentials users
          if (error || !user) {
            const { data: profileUser, error: profileError } = await supabaseClient
              .from('user_profiles')
              .select('id, email, name, password_hash, role')
              .eq('email', email)
              .single()
            
            if (profileError || !profileUser) {
              throw new Error("Invalid email or password")
            }
            
            // Verify password for credentials user
            if (!profileUser.password_hash) {
              throw new Error("Account uses OAuth authentication")
            }
            
            const isValidPassword = await verifyPassword(credentials.password as string, profileUser.password_hash as string)
            if (!isValidPassword) {
              throw new Error("Invalid email or password")
            }
            
            // Reset rate limit on successful login
            resetRateLimit(email, 'LOGIN')
            
            return {
              id: profileUser.id,
              email: profileUser.email,
              name: profileUser.name,
              role: (profileUser.role as 'user' | 'admin' | 'super_admin') || 'user',
            }
          }
          
          // For OAuth users in users table (no password)
          // Reset rate limit on successful OAuth user recognition
          resetRateLimit(email, 'LOGIN')
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: (user.role as 'user' | 'admin' | 'super_admin') || 'user',
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // JWT settings not needed when using database sessions
  // jwt is only used for database sessions to sign session tokens
  
  // Let NextAuth handle cookie configuration automatically for JWT strategy
  // Custom cookie config removed to fix session token issues
  
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Additional security checks can be added here
      if (account?.provider === "google") {
        // Verify Google email is verified
        if (profile && 'email_verified' in profile && profile.email_verified !== true) {
          return false
        }
      }
      
      return true
    },
    
    async jwt({ token, user, account }: any) {
      // For initial signin with OAuth providers
      if (account && user) {
        console.log('🔍 JWT callback - initial signin:', { user, account: account.provider })
        
        // For Google OAuth, we need to find/create user in database
        if (account.provider === 'google') {
          try {
            // First, try to find existing user in users table
            const { data: existingUser } = await supabaseClient
              .from('users')
              .select('id, email, name, role')
              .eq('email', user.email)
              .single()
            
            if (existingUser) {
              console.log('✅ Found existing OAuth user:', existingUser)
              token.id = existingUser.id
              token.role = existingUser.role || 'user'
              token.email = existingUser.email
              token.name = existingUser.name
            } else {
              // User doesn't exist, this should be handled by the adapter
              // But since we're not using adapter, we need to create the user
              console.log('❌ OAuth user not found in database - this should not happen')
              token.id = user.id
              token.role = 'user' // Default role for new users
              token.email = user.email
              token.name = user.name
            }
          } catch (error) {
            console.error('❌ JWT callback database query failed:', error)
            // Fallback to user object from OAuth
            token.id = user.id
            token.role = (user as any).role || 'user'
            token.email = user.email
            token.name = user.name
          }
        } else {
          // For credentials provider, user object already has role
          token.id = user.id
          token.role = (user as any).role || 'user'
          token.email = user.email
          token.name = user.name
        }
        
        console.log('✅ JWT token created:', { id: token.id, email: token.email, role: token.role })
      }
      
      // On subsequent requests, refresh role from database if needed
      if (token.email && (!token.role || token.role === 'user')) {
        try {
          const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('email', token.email)
            .single()
          
          if (userData?.role) {
            token.role = userData.role as 'user' | 'admin' | 'super_admin'
            console.log('🔄 Refreshed user role from database:', { email: token.email, role: token.role })
          }
        } catch (error) {
          console.warn('Could not refresh user role for JWT:', error)
          token.role = token.role || 'user'
        }
      }
      
      return token
    },
    
    async session({ session, token }: any) {
      console.log('🔍 Session callback:', { session: !!session, token: !!token })
      
      // Send properties to the client, like an access_token from a provider
      if (token && session?.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = (token.role as 'user' | 'admin' | 'super_admin') || 'user'
        
        console.log('✅ Session created:', { 
          id: session.user.id, 
          email: session.user.email, 
          role: session.user.role 
        })
      } else {
        console.log('❌ Session callback missing token or session.user')
      }
      
      return session
    },
    
    async redirect({ url, baseUrl }: any) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }: any) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
      
      // For OAuth users, the adapter creates the user in users table
      // No need to create duplicate user_profiles for OAuth users
      // Credentials users are handled separately in the authorize function
    },
    
    async signOut() {
      console.log('User signed out')
    },
  },
  
  debug: process.env.NODE_ENV === "development",
  
  // Security configuration  
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
  
  // Trust host configuration for deployment and HTTPS
  trustHost: true,
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)

// Export auth utilities
export { passwordSchema, emailSchema, hashPassword, verifyPassword }

// Helper function to get server-side session
export const getServerSession = () => auth()

// Type definitions are in src/types/next-auth.d.ts