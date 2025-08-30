/**
 * Database type definitions for Supabase
 * These types represent the database schema and tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User profiles table
export interface UserProfilesTable {
  Row: {
    id: string
    email: string
    name: string | null
    role: 'user' | 'admin' | 'super_admin'
    created_at: string
    updated_at: string
    password_hash: string | null
    reset_token: string | null
    reset_token_expires_at: string | null
    email_verified: boolean | null
    verification_token: string | null
    verification_token_expires_at: string | null
    user_id: string | null
  }
  Insert: {
    id: string
    email: string
    name?: string | null
    role?: 'user' | 'admin' | 'super_admin'
    created_at?: string
    updated_at?: string
    password_hash?: string | null
    reset_token?: string | null
    reset_token_expires_at?: string | null
    email_verified?: boolean | null
    verification_token?: string | null
    verification_token_expires_at?: string | null
    user_id?: string | null
  }
  Update: {
    id?: string
    email?: string
    name?: string | null
    role?: 'user' | 'admin' | 'super_admin'
    created_at?: string
    updated_at?: string
    password_hash?: string | null
    reset_token?: string | null
    reset_token_expires_at?: string | null
    email_verified?: boolean | null
    verification_token?: string | null
    verification_token_expires_at?: string | null
    user_id?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "user_profiles_id_fkey"
      columns: ["id"]
      isOneToOne: true
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

// Audit logs table
export interface AuditLogsTable {
  Row: {
    id: string
    user_id: string | null
    action: string
    table_name: string | null
    record_id: string | null
    old_values: Json | null
    new_values: Json | null
    timestamp: string
    user_email: string | null
    ip_address: string | null
    user_agent: string | null
    severity: string
  }
  Insert: {
    id?: string
    user_id?: string | null
    action: string
    table_name?: string | null
    record_id?: string | null
    old_values?: Json | null
    new_values?: Json | null
    timestamp?: string
    user_email?: string | null
    ip_address?: string | null
    user_agent?: string | null
    severity?: string
  }
  Update: {
    id?: string
    user_id?: string | null
    action?: string
    table_name?: string | null
    record_id?: string | null
    old_values?: Json | null
    new_values?: Json | null
    timestamp?: string
    user_email?: string | null
    ip_address?: string | null
    user_agent?: string | null
    severity?: string
  }
  Relationships: [
    {
      foreignKeyName: "audit_logs_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

// Main database schema
export interface Database {
  public: {
    Tables: {
      user_profiles: UserProfilesTable
      audit_logs: AuditLogsTable
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          email_verified: string | null
          image: string | null
          role: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          email_verified?: string | null
          image?: string | null
          role?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          email_verified?: string | null
          image?: string | null
          role?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
        }
        Insert: {
          id: string
          user_id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          session_token: string
          user_id: string
          expires: string
        }
        Insert: {
          id: string
          session_token: string
          user_id: string
          expires: string
        }
        Update: {
          id?: string
          session_token?: string
          user_id?: string
          expires?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      verification_tokens: {
        Row: {
          identifier: string
          token: string
          expires: string
        }
        Insert: {
          identifier: string
          token: string
          expires: string
        }
        Update: {
          identifier?: string
          token?: string
          expires?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id?: string
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: {
          user_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never