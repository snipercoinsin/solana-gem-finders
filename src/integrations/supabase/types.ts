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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      failed_tokens: {
        Row: {
          contract_address: string
          created_at: string
          failure_reasons: string[] | null
          id: string
          token_name: string | null
          token_symbol: string | null
        }
        Insert: {
          contract_address: string
          created_at?: string
          failure_reasons?: string[] | null
          id?: string
          token_name?: string | null
          token_symbol?: string | null
        }
        Update: {
          contract_address?: string
          created_at?: string
          failure_reasons?: string[] | null
          id?: string
          token_name?: string | null
          token_symbol?: string | null
        }
        Relationships: []
      }
      scan_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          scan_type: string
          tokens_failed: number | null
          tokens_passed: number | null
          tokens_scanned: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          scan_type: string
          tokens_failed?: number | null
          tokens_passed?: number | null
          tokens_scanned?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          scan_type?: string
          tokens_failed?: number | null
          tokens_passed?: number | null
          tokens_scanned?: number | null
        }
        Relationships: []
      }
      site_ads: {
        Row: {
          content: string
          content_type: string
          created_at: string
          id: string
          is_active: boolean | null
          position: Database["public"]["Enums"]["ad_position"]
          updated_at: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          position: Database["public"]["Enums"]["ad_position"]
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          position?: Database["public"]["Enums"]["ad_position"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verified_tokens: {
        Row: {
          buy_tax: number | null
          chain: string
          contract_address: string
          contract_verified: boolean | null
          created_at: string
          current_price: number | null
          dexscreener_url: string | null
          honeypot_safe: boolean | null
          id: string
          launch_time: string
          liquidity_lock_duration_months: number | null
          liquidity_locked: boolean | null
          liquidity_usd: number | null
          market_cap: number | null
          ownership_renounced: boolean | null
          rugcheck_url: string | null
          safety_reasons: string[] | null
          safety_score: number | null
          sell_tax: number | null
          solscan_url: string | null
          telegram_url: string | null
          token_name: string
          token_symbol: string
          twitter_url: string | null
          updated_at: string
          volume_24h: number | null
          website_url: string | null
        }
        Insert: {
          buy_tax?: number | null
          chain?: string
          contract_address: string
          contract_verified?: boolean | null
          created_at?: string
          current_price?: number | null
          dexscreener_url?: string | null
          honeypot_safe?: boolean | null
          id?: string
          launch_time: string
          liquidity_lock_duration_months?: number | null
          liquidity_locked?: boolean | null
          liquidity_usd?: number | null
          market_cap?: number | null
          ownership_renounced?: boolean | null
          rugcheck_url?: string | null
          safety_reasons?: string[] | null
          safety_score?: number | null
          sell_tax?: number | null
          solscan_url?: string | null
          telegram_url?: string | null
          token_name: string
          token_symbol: string
          twitter_url?: string | null
          updated_at?: string
          volume_24h?: number | null
          website_url?: string | null
        }
        Update: {
          buy_tax?: number | null
          chain?: string
          contract_address?: string
          contract_verified?: boolean | null
          created_at?: string
          current_price?: number | null
          dexscreener_url?: string | null
          honeypot_safe?: boolean | null
          id?: string
          launch_time?: string
          liquidity_lock_duration_months?: number | null
          liquidity_locked?: boolean | null
          liquidity_usd?: number | null
          market_cap?: number | null
          ownership_renounced?: boolean | null
          rugcheck_url?: string | null
          safety_reasons?: string[] | null
          safety_score?: number | null
          sell_tax?: number | null
          solscan_url?: string | null
          telegram_url?: string | null
          token_name?: string
          token_symbol?: string
          twitter_url?: string | null
          updated_at?: string
          volume_24h?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_position: "top" | "bottom" | "left" | "right"
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      ad_position: ["top", "bottom", "left", "right"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
