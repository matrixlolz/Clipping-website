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
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      brand_applications: {
        Row: {
          admin_notes: string | null
          campaign_goals: string
          company_name: string
          created_at: string
          email: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          campaign_goals: string
          company_name: string
          created_at?: string
          email: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          campaign_goals?: string
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string
          /** Whop company id (`biz_…`) when the campaign belongs to an embedded experience. */
          whop_company_id: string | null
          description: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          image_url: string | null
          max_earnings_per_post: number | null
          min_payout_views: number | null
          min_views: number
          name: string
          niche: string | null
          platforms: Database["public"]["Enums"]["platform_type"][]
          rate_unit: number
          rate_value: number
          required_hashtags: string[] | null
          required_links: string[] | null
          requirements: string | null
          spent_budget: number
          status: Database["public"]["Enums"]["campaign_status"]
          total_budget: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          whop_company_id?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          max_earnings_per_post?: number | null
          min_payout_views?: number | null
          min_views?: number
          name: string
          niche?: string | null
          platforms?: Database["public"]["Enums"]["platform_type"][]
          rate_unit?: number
          rate_value?: number
          required_hashtags?: string[] | null
          required_links?: string[] | null
          requirements?: string | null
          spent_budget?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          total_budget?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          whop_company_id?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          max_earnings_per_post?: number | null
          min_payout_views?: number | null
          min_views?: number
          name?: string
          niche?: string | null
          platforms?: Database["public"]["Enums"]["platform_type"][]
          rate_unit?: number
          rate_value?: number
          required_hashtags?: string[] | null
          required_links?: string[] | null
          requirements?: string | null
          spent_budget?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          total_budget?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payout_email: string
          payout_method: string
          processed_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payout_email: string
          payout_method: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payout_email?: string
          payout_method?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_banned: boolean
          payment_verified: boolean
          payout_email: string | null
          payout_method: string | null
          referral_code: string | null
          referred_by: string | null
          solana_wallet_address: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_banned?: boolean
          payment_verified?: boolean
          payout_email?: string | null
          payout_method?: string | null
          referral_code?: string | null
          referred_by?: string | null
          solana_wallet_address?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          payment_verified?: boolean
          payout_email?: string | null
          payout_method?: string | null
          referral_code?: string | null
          referred_by?: string | null
          solana_wallet_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          earnings: number
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          earnings?: number
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          earnings?: number
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          created_at: string | null
          id: string
          platform: Database["public"]["Enums"]["platform_type"]
          profile_url: string | null
          updated_at: string | null
          user_id: string
          username: string
          verification_code: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: Database["public"]["Enums"]["platform_type"]
          profile_url?: string | null
          updated_at?: string | null
          user_id: string
          username: string
          verification_code?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          profile_url?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verification_code?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          admin_notes: string | null
          auto_rejected: boolean | null
          campaign_id: string
          clip_url: string
          comments: number | null
          created_at: string
          creator_id: string
          earnings: number
          id: string
          likes: number | null
          platform: Database["public"]["Enums"]["platform_type"]
          rejection_reason: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_views: number | null
          updated_at: string
          views: number
        }
        Insert: {
          admin_notes?: string | null
          auto_rejected?: boolean | null
          campaign_id: string
          clip_url: string
          comments?: number | null
          created_at?: string
          creator_id: string
          earnings?: number
          id?: string
          likes?: number | null
          platform: Database["public"]["Enums"]["platform_type"]
          rejection_reason?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_views?: number | null
          updated_at?: string
          views?: number
        }
        Update: {
          admin_notes?: string | null
          auto_rejected?: boolean | null
          campaign_id?: string
          clip_url?: string
          comments?: number | null
          created_at?: string
          creator_id?: string
          earnings?: number
          id?: string
          likes?: number | null
          platform?: Database["public"]["Enums"]["platform_type"]
          rejection_reason?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_views?: number | null
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          id: string
          locked_earnings: number
          paid_balance: number
          pending_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked_earnings?: number
          paid_balance?: number
          pending_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          locked_earnings?: number
          paid_balance?: number
          pending_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upgrade_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "creator" | "brand" | "admin"
      campaign_status: "active" | "paused" | "completed" | "private"
      payout_status: "pending" | "approved" | "paid" | "rejected"
      platform_type: "tiktok" | "instagram" | "youtube"
      submission_status: "pending" | "approved" | "rejected" | "paid"
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
      app_role: ["creator", "brand", "admin"],
      campaign_status: ["active", "paused", "completed", "private"],
      payout_status: ["pending", "approved", "paid", "rejected"],
      platform_type: ["tiktok", "instagram", "youtube"],
      submission_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
