import NextAuth from "next-auth"
import { createAuthAdapter } from "./auth-adapter"
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

const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createAuthAdapter(),
  
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
          
          // Query user from database
          const { data: user, error } = await supabaseClient
            .from('user_profiles')
            .select('id, email, name, password_hash')
            .eq('email', email)
            .single()
          
          if (error || !user) {
            throw new Error("Invalid email or password")
          }
          
          // Verify password
          if (!user.password_hash) {
            throw new Error("Account uses OAuth authentication")
          }
          
          const isValidPassword = await verifyPassword(credentials.password as string, user.password_hash as string)
          if (!isValidPassword) {
            throw new Error("Invalid email or password")
          }
          
          // Reset rate limit on successful login
          resetRateLimit(email, 'LOGIN')
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    // Use NEXTAUTH_SECRET for signing
  },
  
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
      },
    },
  },
  
  pages: {
    signIn: "/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  
  callbacks: {
    async signIn({ user, account, profile, email }) {
      // Additional security checks can be added here
      if (account?.provider === "google") {
        // Verify Google email is verified
        if (profile?.email_verified !== true) {
          return false
        }
      }
      
      return true
    },
    
    async jwt({ token, user, account }) {
      // Add user ID to token on initial sign in
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name || null
      }
      
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub!
        session.user.email = token.email!
        session.user.name = token.name || null
      }
      
      return session
    },
    
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
      
      // Create user profile if new user
      if (isNewUser && user.email) {
        try {
          await supabaseClient
            .from('user_profiles')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name || null,
            })
        } catch (error) {
          console.error("Error creating user profile:", error)
        }
      }
    },
    
    async signOut() {
      console.log('User signed out')
    },
  },
  
  debug: process.env.NODE_ENV === "development",
  
  // Security configuration
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
  
  // CSRF protection is enabled by default
  
  // Trust host configuration for deployment
  trustHost: true,
})

// Export auth utilities
export { passwordSchema, emailSchema, hashPassword, verifyPassword }

// Helper function to get server-side session
export const getServerSession = () => auth()

// Type definitions
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
  
  interface User {
    id: string
    email: string
    name?: string | null
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    sub: string
    email: string
    name?: string | null
  }
}