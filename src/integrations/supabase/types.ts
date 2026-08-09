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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      agencies: {
        Row: {
          commission_percent: number
          created_at: string
          id: string
          name: string
          owner_id: string
          status: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          id?: string
          name: string
          owner_id: string
          status?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          status?: string
        }
        Relationships: []
      }
      agency_members: {
        Row: {
          agency_id: string
          host_id: string
          id: string
          joined_at: string
        }
        Insert: {
          agency_id: string
          host_id: string
          id?: string
          joined_at?: string
        }
        Update: {
          agency_id?: string
          host_id?: string
          id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bans: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_permanent: boolean
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coin_packages: {
        Row: {
          bonus_coins: number
          coins: number
          created_at: string
          display_price: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          bonus_coins?: number
          coins: number
          created_at?: string
          display_price?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          bonus_coins?: number
          coins?: number
          created_at?: string
          display_price?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      coin_purchase_requests: {
        Row: {
          admin_note: string | null
          coins: number
          created_at: string
          display_price: string
          id: string
          package_id: string | null
          payment_reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          coins: number
          created_at?: string
          display_price?: string
          id?: string
          package_id?: string | null
          payment_reference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          coins?: number
          created_at?: string
          display_price?: string
          id?: string
          package_id?: string | null
          payment_reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_purchase_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "coin_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["coin_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["coin_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["coin_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          battle_id: string | null
          coins_spent: number
          created_at: string
          diamonds_earned: number
          gift_id: string
          id: string
          quantity: number
          receiver_id: string
          room_id: string | null
          sender_id: string
        }
        Insert: {
          battle_id?: string | null
          coins_spent: number
          created_at?: string
          diamonds_earned: number
          gift_id: string
          id?: string
          quantity?: number
          receiver_id: string
          room_id?: string | null
          sender_id: string
        }
        Update: {
          battle_id?: string | null
          coins_spent?: number
          created_at?: string
          diamonds_earned?: number
          gift_id?: string
          id?: string
          quantity?: number
          receiver_id?: string
          room_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          animation_key: string
          animation_url: string | null
          coin_price: number
          created_at: string
          diamond_reward: number
          icon: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tier: string
        }
        Insert: {
          animation_key?: string
          animation_url?: string | null
          coin_price: number
          created_at?: string
          diamond_reward: number
          icon?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tier?: string
        }
        Update: {
          animation_key?: string
          animation_url?: string | null
          coin_price?: number
          created_at?: string
          diamond_reward?: number
          icon?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tier?: string
        }
        Relationships: []
      }
      host_applications: {
        Row: {
          admin_note: string | null
          age: number | null
          country: string
          created_at: string
          experience: string
          id: string
          real_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          social_link: string | null
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          age?: number | null
          country?: string
          created_at?: string
          experience?: string
          id?: string
          real_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          age?: number | null
          country?: string
          created_at?: string
          experience?: string
          id?: string
          real_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
        }
        Relationships: []
      }
      host_earnings: {
        Row: {
          created_at: string
          diamonds: number
          host_id: string
          id: string
          reference_id: string | null
          source: string
        }
        Insert: {
          created_at?: string
          diamonds: number
          host_id: string
          id?: string
          reference_id?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          diamonds?: number
          host_id?: string
          id?: string
          reference_id?: string | null
          source?: string
        }
        Relationships: []
      }
      hosts: {
        Row: {
          agency_id: string | null
          approved_at: string
          created_at: string
          host_level: number
          status: Database["public"]["Enums"]["host_status"]
          total_diamonds: number
          total_gifts_received: number
          total_live_seconds: number
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          approved_at?: string
          created_at?: string
          host_level?: number
          status?: Database["public"]["Enums"]["host_status"]
          total_diamonds?: number
          total_gifts_received?: number
          total_live_seconds?: number
          user_id: string
        }
        Update: {
          agency_id?: string | null
          approved_at?: string
          created_at?: string
          host_level?: number
          status?: Database["public"]["Enums"]["host_status"]
          total_diamonds?: number
          total_gifts_received?: number
          total_live_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      live_messages: {
        Row: {
          avatar_url: string | null
          body: string
          created_at: string
          id: string
          is_host: boolean
          is_moderator: boolean
          kind: Database["public"]["Enums"]["live_message_kind"]
          meta: Json
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_host?: boolean
          is_moderator?: boolean
          kind?: Database["public"]["Enums"]["live_message_kind"]
          meta?: Json
          room_id: string
          user_id?: string | null
          username?: string
        }
        Update: {
          avatar_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_host?: boolean
          is_moderator?: boolean
          kind?: Database["public"]["Enums"]["live_message_kind"]
          meta?: Json
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      live_participants: {
        Row: {
          id: string
          is_banned: boolean
          is_muted: boolean
          joined_at: string
          left_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_banned?: boolean
          is_muted?: boolean
          joined_at?: string
          left_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_banned?: boolean
          is_muted?: boolean
          joined_at?: string
          left_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      live_rooms: {
        Row: {
          category: string
          country: string
          created_at: string
          diamonds_earned: number
          ended_at: string | null
          host_id: string
          id: string
          language: string
          likes_count: number
          peak_viewers: number
          started_at: string
          status: Database["public"]["Enums"]["room_status"]
          stream_channel_id: string
          thumbnail_url: string | null
          title: string
          viewer_count: number
        }
        Insert: {
          category?: string
          country?: string
          created_at?: string
          diamonds_earned?: number
          ended_at?: string | null
          host_id: string
          id?: string
          language?: string
          likes_count?: number
          peak_viewers?: number
          started_at?: string
          status?: Database["public"]["Enums"]["room_status"]
          stream_channel_id?: string
          thumbnail_url?: string | null
          title?: string
          viewer_count?: number
        }
        Update: {
          category?: string
          country?: string
          created_at?: string
          diamonds_earned?: number
          ended_at?: string | null
          host_id?: string
          id?: string
          language?: string
          likes_count?: number
          peak_viewers?: number
          started_at?: string
          status?: Database["public"]["Enums"]["room_status"]
          stream_channel_id?: string
          thumbnail_url?: string | null
          title?: string
          viewer_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pk_battles: {
        Row: {
          created_at: string
          duration_seconds: number
          ends_at: string | null
          host_a: string
          host_b: string
          id: string
          room_a: string | null
          room_b: string | null
          score_a: number
          score_b: number
          started_at: string | null
          status: Database["public"]["Enums"]["battle_status"]
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          ends_at?: string | null
          host_a: string
          host_b: string
          id?: string
          room_a?: string | null
          room_b?: string | null
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["battle_status"]
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          ends_at?: string | null
          host_a?: string
          host_b?: string
          id?: string
          room_a?: string | null
          room_b?: string | null
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["battle_status"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pk_battles_room_a_fkey"
            columns: ["room_a"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pk_battles_room_b_fkey"
            columns: ["room_b"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[]
          bio: string
          country: string
          created_at: string
          display_name: string
          followers_count: number
          following_count: number
          gender: string
          id: string
          is_online: boolean
          is_suspended: boolean
          language: string
          last_seen_at: string
          level: number
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[]
          bio?: string
          country?: string
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          gender?: string
          id: string
          is_online?: boolean
          is_suspended?: boolean
          language?: string
          last_seen_at?: string
          level?: number
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          badges?: string[]
          bio?: string
          country?: string
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          gender?: string
          id?: string
          is_online?: boolean
          is_suspended?: boolean
          language?: string
          last_seen_at?: string
          level?: number
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string
          created_at: string
          details: string
          id: string
          reporter_id: string
          resolution: string | null
          status: string
          target_room_id: string | null
          target_user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          details?: string
          id?: string
          reporter_id: string
          resolution?: string | null
          status?: string
          target_room_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: string
          id?: string
          reporter_id?: string
          resolution?: string | null
          status?: string
          target_room_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_target_room_id_fkey"
            columns: ["target_room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
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
      wallets: {
        Row: {
          coins: number
          diamonds: number
          total_coins_purchased: number
          total_coins_spent: number
          total_diamonds_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          diamonds?: number
          total_coins_purchased?: number
          total_coins_spent?: number
          total_diamonds_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          diamonds?: number
          total_coins_purchased?: number
          total_coins_spent?: number
          total_diamonds_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          created_at: string
          diamonds: number
          host_id: string
          id: string
          payout_details: string
          payout_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          diamonds: number
          host_id: string
          id?: string
          payout_details: string
          payout_method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          diamonds?: number
          host_id?: string
          id?: string
          payout_details?: string
          payout_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      admin_adjust_coins: {
        Args: { _amount: number; _reason?: string; _user_id: string }
        Returns: Json
      }
      admin_stats: { Args: never; Returns: Json }
      get_rankings: {
        Args: {
          _country?: string
          _kind: string
          _limit?: number
          _period: string
        }
        Returns: {
          avatar_url: string
          country: string
          display_name: string
          level: number
          score: number
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      request_withdrawal: {
        Args: { _details: string; _diamonds: number; _method: string }
        Returns: Json
      }
      review_coin_request: {
        Args: { _approve: boolean; _note?: string; _request_id: string }
        Returns: Json
      }
      review_host_application: {
        Args: { _app_id: string; _approve: boolean; _note?: string }
        Returns: Json
      }
      review_withdrawal: {
        Args: {
          _id: string
          _note?: string
          _status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Returns: Json
      }
      send_gift: {
        Args: {
          _gift_id: string
          _quantity?: number
          _receiver_id: string
          _room_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status: "pending" | "approved" | "rejected"
      battle_status:
        | "invited"
        | "declined"
        | "active"
        | "finished"
        | "cancelled"
      coin_tx_type:
        | "purchase"
        | "gift_sent"
        | "admin_credit"
        | "admin_debit"
        | "signup_bonus"
        | "refund"
      host_status: "active" | "suspended" | "pending"
      live_message_kind: "chat" | "system" | "gift" | "join"
      request_status: "pending" | "approved" | "rejected"
      room_status: "live" | "ended"
      withdrawal_status:
        | "pending"
        | "approved"
        | "processing"
        | "completed"
        | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      application_status: ["pending", "approved", "rejected"],
      battle_status: ["invited", "declined", "active", "finished", "cancelled"],
      coin_tx_type: [
        "purchase",
        "gift_sent",
        "admin_credit",
        "admin_debit",
        "signup_bonus",
        "refund",
      ],
      host_status: ["active", "suspended", "pending"],
      live_message_kind: ["chat", "system", "gift", "join"],
      request_status: ["pending", "approved", "rejected"],
      room_status: ["live", "ended"],
      withdrawal_status: [
        "pending",
        "approved",
        "processing",
        "completed",
        "rejected",
      ],
    },
  },
} as const
