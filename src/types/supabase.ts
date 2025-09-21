export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      hack_prerequisites: {
        Row: {
          created_at: string | null
          hack_id: string | null
          id: string
          prerequisite_hack_id: string | null
        }
        Insert: {
          created_at?: string | null
          hack_id?: string | null
          id?: string
          prerequisite_hack_id?: string | null
        }
        Update: {
          created_at?: string | null
          hack_id?: string | null
          id?: string
          prerequisite_hack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hack_prerequisites_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hack_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hack_prerequisites_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hack_prerequisites_prerequisite_hack_id_fkey"
            columns: ["prerequisite_hack_id"]
            isOneToOne: false
            referencedRelation: "hack_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hack_prerequisites_prerequisite_hack_id_fkey"
            columns: ["prerequisite_hack_id"]
            isOneToOne: false
            referencedRelation: "hacks"
            referencedColumns: ["id"]
          },
        ]
      }
      hack_tags: {
        Row: {
          created_at: string | null
          hack_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          hack_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          hack_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hack_tags_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hack_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hack_tags_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hack_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      hacks: {
        Row: {
          content_body: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          description: string
          difficulty: string | null
          external_link: string | null
          id: string
          image_path: string | null
          image_url: string | null
          name: string
          slug: string
          time_minutes: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content_body?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          difficulty?: string | null
          external_link?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          name: string
          slug: string
          time_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content_body?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          difficulty?: string | null
          external_link?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          name?: string
          slug?: string
          time_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hacks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hacks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      routine_hacks: {
        Row: {
          created_at: string | null
          hack_id: string | null
          id: string
          position: number | null
          routine_id: string | null
        }
        Insert: {
          created_at?: string | null
          hack_id?: string | null
          id?: string
          position?: number | null
          routine_id?: string | null
        }
        Update: {
          created_at?: string | null
          hack_id?: string | null
          id?: string
          position?: number | null
          routine_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_hacks_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hack_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_hacks_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_hacks_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_tags: {
        Row: {
          created_at: string | null
          routine_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          routine_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          routine_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_tags_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          id: string
          image_path: string | null
          image_url: string | null
          is_public: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_public?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_public?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          tag_type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          tag_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          tag_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_hacks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          hack_id: string | null
          id: string
          liked: boolean | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          viewed: boolean | null
          viewed_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          hack_id?: string | null
          id?: string
          liked?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          hack_id?: string | null
          id?: string
          liked?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_hacks_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hack_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hacks_hack_id_fkey"
            columns: ["hack_id"]
            isOneToOne: false
            referencedRelation: "hacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hacks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_routines: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          liked: boolean | null
          progress: number | null
          routine_id: string | null
          started: boolean | null
          started_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          liked?: boolean | null
          progress?: number | null
          routine_id?: string | null
          started?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          liked?: boolean | null
          progress?: number | null
          routine_id?: string | null
          started?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          created_at: string | null
          id: string
          source: string | null
          tag_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          source?: string | null
          tag_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          source?: string | null
          tag_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hack_details: {
        Row: {
          content_body: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          creator_avatar: string | null
          creator_name: string | null
          description: string | null
          difficulty: string | null
          external_link: string | null
          id: string | null
          image_path: string | null
          image_url: string | null
          likes_count: number | null
          name: string | null
          slug: string | null
          time_minutes: number | null
          updated_at: string | null
          updated_by: string | null
          views_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hacks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hacks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_type: "content" | "link"
      question_type: "single_choice" | "multiple_choice" | "text"
      tag_source: "web" | "discord" | "onboarding" | "admin" | "system"
      tag_type: "user_experience" | "user_interest" | "user_special" | "content"
      user_hack_status: "interested" | "liked" | "visited"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      content_type: ["content", "link"],
      question_type: ["single_choice", "multiple_choice", "text"],
      tag_source: ["web", "discord", "onboarding", "admin", "system"],
      tag_type: ["user_experience", "user_interest", "user_special", "content"],
      user_hack_status: ["interested", "liked", "visited"],
    },
  },
} as const

