import { SupabaseAdapter } from '@auth/supabase-adapter'
import { createClient } from '@supabase/supabase-js'
import { Adapter } from 'next-auth/adapters'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables for adapter')
}

// Create a Supabase client with service role for database operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Create the base Supabase adapter
const baseAdapter = SupabaseAdapter({
  url: supabaseUrl,
  secret: supabaseServiceRoleKey,
})

// Extend the adapter to ensure proper user creation for OAuth
export function createAuthAdapter(): Adapter {
  return {
    ...baseAdapter,
    
    // Override createUser to ensure proper user creation
    async createUser(user) {
      try {
        // First create the user in the users table
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: user.email,
            name: user.name,
            image: user.image,
            email_verified: user.emailVerified,
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user:', userError)
          throw userError
        }

        // Also create a user profile for consistency
        if (newUser) {
          await supabase
            .from('user_profiles')
            .insert({
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
            })
            .single()
        }

        return newUser
      } catch (error) {
        console.error('Failed to create user:', error)
        throw error
      }
    },

    // Override getUserByAccount to handle the lookup properly
    async getUserByAccount(account) {
      try {
        // First check if the account exists
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('provider', account.provider)
          .eq('provider_account_id', account.providerAccountId)
          .single()

        if (accountError || !accountData) {
          return null
        }

        // Get the user associated with this account
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', accountData.user_id)
          .single()

        if (userError || !user) {
          return null
        }

        return user
      } catch (error) {
        console.error('Error getting user by account:', error)
        return null
      }
    },

    // Override linkAccount to ensure proper account linking
    async linkAccount(account) {
      try {
        const { error } = await supabase
          .from('accounts')
          .insert({
            user_id: account.userId,
            type: account.type,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          })

        if (error) {
          console.error('Error linking account:', error)
          throw error
        }

        return account
      } catch (error) {
        console.error('Failed to link account:', error)
        throw error
      }
    },

    // Override getUser to ensure we get the user properly
    async getUser(id) {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !user) {
          return null
        }

        return user
      } catch (error) {
        console.error('Error getting user:', error)
        return null
      }
    },

    // Override getUserByEmail to check by email
    async getUserByEmail(email) {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error || !user) {
          return null
        }

        return user
      } catch (error) {
        console.error('Error getting user by email:', error)
        return null
      }
    },
  }
}