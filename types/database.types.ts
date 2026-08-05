export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      bingo_cards: {
        Row: {
          card_index: number
          created_at: string
          device_id: string
          grid: Json
          marked_numbers: number[]
          updated_at: string
        }
        Insert: {
          card_index?: number
          created_at?: string
          device_id: string
          grid: Json
          marked_numbers?: number[]
          updated_at?: string
        }
        Update: {
          card_index?: number
          created_at?: string
          device_id?: string
          grid?: Json
          marked_numbers?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      bingo_settings: {
        Row: {
          auto_assign_cards: boolean
          cards_per_visitor: number
          cards_reset_at: string | null
          drawn_numbers: number[]
          enabled: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          auto_assign_cards?: boolean
          cards_per_visitor?: number
          cards_reset_at?: string | null
          drawn_numbers?: number[]
          enabled?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          auto_assign_cards?: boolean
          cards_per_visitor?: number
          cards_reset_at?: string | null
          drawn_numbers?: number[]
          enabled?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      event_schedule: {
        Row: {
          created_at: string
          end_time: string
          event_date: string
          id: string
          name: string
          start_time: string
          theme: string
        }
        Insert: {
          created_at?: string
          end_time: string
          event_date: string
          id?: string
          name: string
          start_time: string
          theme: string
        }
        Update: {
          created_at?: string
          end_time?: string
          event_date?: string
          id?: string
          name?: string
          start_time?: string
          theme?: string
        }
        Relationships: []
      }
      feature_settings: {
        Row: {
          destacados_enabled: boolean
          id: boolean
          map_enabled: boolean
          updated_at: string
        }
        Insert: {
          destacados_enabled?: boolean
          id?: boolean
          map_enabled?: boolean
          updated_at?: string
        }
        Update: {
          destacados_enabled?: boolean
          id?: boolean
          map_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      header_settings: {
        Row: {
          default_theme: string
          id: boolean
          updated_at: string
        }
        Insert: {
          default_theme?: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          default_theme?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          album_id: string | null
          created_at: string
          duration_ms: number | null
          featured_at: string | null
          height: number
          id: string
          ip_hash: string
          is_featured: boolean
          is_hidden: boolean
          is_unlisted: boolean
          latitude: number | null
          longitude: number | null
          media_type: string
          mime_type: string
          size_bytes: number
          sort_date: string | null
          storage_path: string
          taken_at: string | null
          thumbnail_path: string
          width: number
        }
        Insert: {
          album_id?: string | null
          created_at?: string
          duration_ms?: number | null
          featured_at?: string | null
          height: number
          id?: string
          ip_hash: string
          is_featured?: boolean
          is_hidden?: boolean
          is_unlisted?: boolean
          latitude?: number | null
          longitude?: number | null
          media_type: string
          mime_type: string
          size_bytes: number
          sort_date?: string | null
          storage_path: string
          taken_at?: string | null
          thumbnail_path: string
          width: number
        }
        Update: {
          album_id?: string | null
          created_at?: string
          duration_ms?: number | null
          featured_at?: string | null
          height?: number
          id?: string
          ip_hash?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_unlisted?: boolean
          latitude?: number | null
          longitude?: number | null
          media_type?: string
          mime_type?: string
          size_bytes?: number
          sort_date?: string | null
          storage_path?: string
          taken_at?: string | null
          thumbnail_path?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          assigned_media_id: string | null
          device_id: string
          first_seen_at: string
          name: string | null
        }
        Insert: {
          assigned_media_id?: string | null
          device_id: string
          first_seen_at?: string
          name?: string | null
        }
        Update: {
          assigned_media_id?: string | null
          device_id?: string
          first_seen_at?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_assigned_media_id_fkey"
            columns: ["assigned_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_events: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_hash: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          ip_hash: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          device_id: string
          emoji: string
          id: number
          media_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          emoji: string
          id?: never
          media_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          emoji?: string
          id?: never
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      street_view_usage: {
        Row: {
          load_count: number
          month: string
        }
        Insert: {
          load_count?: number
          month: string
        }
        Update: {
          load_count?: number
          month?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_reaction_counts: {
        Args: { p_media_id: string }
        Returns: {
          count: number
          emoji: string
        }[]
      }
      get_reaction_counts_bulk: {
        Args: { p_media_ids: string[] }
        Returns: {
          count: number
          emoji: string
          media_id: string
        }[]
      }
      get_street_view_load_count_this_month: { Args: never; Returns: number }
      set_bingo_card_number_marked: {
        Args: {
          p_card_index: number
          p_device_id: string
          p_marked: boolean
          p_number: number
        }
        Returns: undefined
      }
      toggle_bingo_number: { Args: { p_number: number }; Returns: number[] }
      try_reserve_street_view_load: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
