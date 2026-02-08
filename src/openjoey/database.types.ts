/**
 * Auto-generated Supabase types for the OpenJoey database.
 * Regenerate with: supabase gen types typescript --project-id clgplkenrdbxqmkkgyzq
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          chain: string | null;
          condition: string;
          created_at: string;
          id: string;
          is_active: boolean;
          last_checked_at: string | null;
          last_price: number | null;
          notes: string | null;
          target_price: number;
          token_address: string | null;
          token_symbol: string;
          trigger_count: number;
          triggered_at: string | null;
          user_id: string;
        };
        Insert: {
          chain?: string | null;
          condition: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_checked_at?: string | null;
          last_price?: number | null;
          notes?: string | null;
          target_price: number;
          token_address?: string | null;
          token_symbol: string;
          trigger_count?: number;
          triggered_at?: string | null;
          user_id: string;
        };
        Update: {
          chain?: string | null;
          condition?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_checked_at?: string | null;
          last_price?: number | null;
          notes?: string | null;
          target_price?: number;
          token_address?: string | null;
          token_symbol?: string;
          trigger_count?: number;
          triggered_at?: string | null;
          user_id?: string;
        };
      };
      referrals: {
        Row: {
          converted_at: string | null;
          created_at: string;
          id: string;
          paid_at: string | null;
          referred_credit: number;
          referred_id: string;
          referrer_credit: number;
          referrer_id: string;
          status: string;
        };
        Insert: {
          converted_at?: string | null;
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          referred_credit?: number;
          referred_id: string;
          referrer_credit?: number;
          referrer_id: string;
          status?: string;
        };
        Update: {
          converted_at?: string | null;
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          referred_credit?: number;
          referred_id?: string;
          referrer_credit?: number;
          referrer_id?: string;
          status?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          last_activity_at: string;
          messages_count: number;
          metadata: Json | null;
          session_key: string;
          started_at: string;
          status: string;
          telegram_chat_id: number | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          last_activity_at?: string;
          messages_count?: number;
          metadata?: Json | null;
          session_key: string;
          started_at?: string;
          status?: string;
          telegram_chat_id?: number | null;
          user_id: string;
        };
        Update: {
          id?: string;
          last_activity_at?: string;
          messages_count?: number;
          metadata?: Json | null;
          session_key?: string;
          started_at?: string;
          status?: string;
          telegram_chat_id?: number | null;
          user_id?: string;
        };
      };
      stripe_events: {
        Row: {
          event_type: string;
          id: string;
          payload: Json | null;
          processed_at: string;
        };
        Insert: {
          event_type: string;
          id: string;
          payload?: Json | null;
          processed_at?: string;
        };
        Update: {
          event_type?: string;
          id?: string;
          payload?: Json | null;
          processed_at?: string;
        };
      };
      usage_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          token_symbol: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          token_symbol?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          token_symbol?: string | null;
          user_id?: string;
        };
      };
      users: {
        Row: {
          charts_reset_at: string | null;
          charts_used_today: number;
          created_at: string;
          credit_balance: number;
          display_name: string | null;
          id: string;
          referral_code: string | null;
          referred_by: string | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_ends_at: string | null;
          subscription_started_at: string | null;
          telegram_id: number;
          telegram_username: string | null;
          tier: string;
          trial_ends_at: string | null;
          trial_started_at: string | null;
          updated_at: string;
        };
        Insert: {
          charts_reset_at?: string | null;
          charts_used_today?: number;
          created_at?: string;
          credit_balance?: number;
          display_name?: string | null;
          id?: string;
          referral_code?: string | null;
          referred_by?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_ends_at?: string | null;
          subscription_started_at?: string | null;
          telegram_id: number;
          telegram_username?: string | null;
          tier?: string;
          trial_ends_at?: string | null;
          trial_started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          charts_reset_at?: string | null;
          charts_used_today?: number;
          created_at?: string;
          credit_balance?: number;
          display_name?: string | null;
          id?: string;
          referral_code?: string | null;
          referred_by?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_ends_at?: string | null;
          subscription_started_at?: string | null;
          telegram_id?: number;
          telegram_username?: string | null;
          tier?: string;
          trial_ends_at?: string | null;
          trial_started_at?: string | null;
          updated_at?: string;
        };
      };
      whale_watches: {
        Row: {
          chain: string;
          created_at: string;
          id: string;
          is_active: boolean;
          label: string | null;
          last_balance: number | null;
          last_checked_at: string | null;
          user_id: string;
          wallet_address: string;
        };
        Insert: {
          chain?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          last_balance?: number | null;
          last_checked_at?: string | null;
          user_id: string;
          wallet_address: string;
        };
        Update: {
          chain?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          last_balance?: number | null;
          last_checked_at?: string | null;
          user_id?: string;
          wallet_address?: string;
        };
      };
    };
    Views: {
      referral_leaderboard: {
        Row: {
          converted_referrals: number | null;
          current_balance: number | null;
          paid_referrals: number | null;
          referral_code: string | null;
          telegram_username: string | null;
          total_earned: number | null;
          total_referrals: number | null;
          user_id: string | null;
        };
      };
      subscriber_stats: {
        Row: {
          avg_credit_balance: number | null;
          status: string | null;
          tier: string | null;
          user_count: number | null;
        };
      };
    };
    Functions: {
      activate_subscription: {
        Args: {
          p_stripe_customer_id: string;
          p_stripe_subscription_id: string;
          p_tier?: string;
        };
        Returns: Json;
      };
      cancel_subscription: {
        Args: { p_stripe_customer_id: string };
        Returns: Json;
      };
      check_tier_access: {
        Args: { p_action?: string; p_telegram_id: number };
        Returns: Json;
      };
      record_chart_usage: {
        Args: { p_telegram_id: number };
        Returns: undefined;
      };
      register_telegram_user: {
        Args: {
          p_display_name?: string;
          p_referral_code?: string;
          p_telegram_id: number;
          p_username?: string;
        };
        Returns: Json;
      };
      reset_daily_charts: { Args: never; Returns: undefined };
    };
  };
};
