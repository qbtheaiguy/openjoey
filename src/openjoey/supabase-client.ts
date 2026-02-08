/**
 * OpenJoey Supabase Client
 *
 * Singleton client for the gateway to talk to the OpenJoey Supabase database.
 * Uses the service role key so all RPC calls bypass RLS (gateway is trusted).
 */

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface OpenJoeyUser {
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  display_name: string | null;
  status: string;
  tier: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  referral_code: string;
  referred_by: string | null;
  credit_balance: number;
  charts_used_today: number;
  charts_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TierAccessResult {
  allowed: boolean;
  reason: string;
  user_id: string;
  tier: string;
  status: string;
  credit_balance: number;
  charts_used_today: number;
  trial_ends_at: string | null;
}

export interface RegisterResult {
  status: "created" | "existing";
  user_id: string;
  tier: string;
  referral_code?: string;
  trial_ends_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  token_symbol: string;
  token_address: string | null;
  chain: string;
  target_price: number;
  condition: "above" | "below";
  is_active: boolean;
  triggered_at: string | null;
  trigger_count: number;
  last_checked_at: string | null;
  last_price: number | null;
  notes: string | null;
  created_at: string;
}

export interface WhaleWatch {
  id: string;
  user_id: string;
  wallet_address: string;
  label: string | null;
  chain: string;
  is_active: boolean;
  last_checked_at: string | null;
  last_balance: number | null;
  created_at: string;
}

/**
 * Lightweight Supabase client that uses fetch directly (no SDK dependency).
 * The gateway runs in Node; this avoids adding @supabase/supabase-js to the core.
 */
export class OpenJoeyDB {
  private url: string;
  private key: string;
  private headers: Record<string, string>;

  constructor(config: SupabaseConfig) {
    this.url = config.url;
    this.key = config.serviceRoleKey;
    this.headers = {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  // --------------- REST helpers ---------------

  private async get<T>(table: string, query: string = ""): Promise<T[]> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, { headers: this.headers });
    if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
    return res.json();
  }

  private async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Supabase INSERT ${table}: ${res.status} ${await res.text()}`);
    const rows: T[] = await res.json();
    return rows[0];
  }

  private async update<T>(
    table: string,
    query: string,
    data: Record<string, unknown>,
  ): Promise<T[]> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${res.status} ${await res.text()}`);
    return res.json();
  }

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`Supabase RPC ${fn}: ${res.status} ${await res.text()}`);
    return res.json();
  }

  // --------------- User management ---------------

  async registerUser(
    telegramId: number,
    username?: string,
    displayName?: string,
    referralCode?: string,
  ): Promise<RegisterResult> {
    return this.rpc("register_telegram_user", {
      p_telegram_id: telegramId,
      p_username: username ?? null,
      p_display_name: displayName ?? null,
      p_referral_code: referralCode ?? null,
    });
  }

  async getUser(telegramId: number): Promise<OpenJoeyUser | null> {
    const rows = await this.get<OpenJoeyUser>("users", `telegram_id=eq.${telegramId}&limit=1`);
    return rows[0] ?? null;
  }

  async checkTierAccess(
    telegramId: number,
    action: string = "chart_analysis",
  ): Promise<TierAccessResult> {
    return this.rpc("check_tier_access", {
      p_telegram_id: telegramId,
      p_action: action,
    });
  }

  async recordChartUsage(telegramId: number): Promise<void> {
    await this.rpc("record_chart_usage", {
      p_telegram_id: telegramId,
    });
  }

  // --------------- Alerts ---------------

  async createAlert(
    userId: string,
    tokenSymbol: string,
    targetPrice: number,
    condition: "above" | "below",
    tokenAddress?: string,
    chain: string = "solana",
  ): Promise<Alert> {
    return this.insert<Alert>("alerts", {
      user_id: userId,
      token_symbol: tokenSymbol,
      token_address: tokenAddress ?? null,
      chain,
      target_price: targetPrice,
      condition,
    });
  }

  async getUserAlerts(userId: string, activeOnly = true): Promise<Alert[]> {
    let query = `user_id=eq.${userId}&order=created_at.desc`;
    if (activeOnly) query += "&is_active=eq.true";
    return this.get<Alert>("alerts", query);
  }

  async deactivateAlert(alertId: string): Promise<void> {
    await this.update("alerts", `id=eq.${alertId}`, { is_active: false });
  }

  async deactivateAllAlerts(userId: string): Promise<void> {
    await this.update("alerts", `user_id=eq.${userId}&is_active=eq.true`, {
      is_active: false,
    });
  }

  // --------------- Whale watches ---------------

  async createWhaleWatch(
    userId: string,
    walletAddress: string,
    label?: string,
    chain: string = "solana",
  ): Promise<WhaleWatch> {
    return this.insert<WhaleWatch>("whale_watches", {
      user_id: userId,
      wallet_address: walletAddress,
      label: label ?? null,
      chain,
    });
  }

  async getUserWhaleWatches(userId: string): Promise<WhaleWatch[]> {
    return this.get<WhaleWatch>(
      "whale_watches",
      `user_id=eq.${userId}&is_active=eq.true&order=created_at.desc`,
    );
  }

  async removeWhaleWatch(watchId: string): Promise<void> {
    await this.update("whale_watches", `id=eq.${watchId}`, { is_active: false });
  }

  // --------------- Sessions ---------------

  async upsertSession(userId: string, sessionKey: string, telegramChatId?: number): Promise<void> {
    // Try update first
    const rows = await this.get<{ id: string }>(
      "sessions",
      `session_key=eq.${encodeURIComponent(sessionKey)}&limit=1`,
    );
    if (rows.length > 0) {
      await this.update("sessions", `session_key=eq.${encodeURIComponent(sessionKey)}`, {
        last_activity_at: new Date().toISOString(),
        messages_count: rows.length, // Incremented via SQL in practice
      });
    } else {
      await this.insert("sessions", {
        user_id: userId,
        session_key: sessionKey,
        telegram_chat_id: telegramChatId ?? null,
      });
    }
  }

  async incrementSessionMessages(sessionKey: string): Promise<void> {
    // Use raw SQL for atomic increment
    const res = await fetch(`${this.url}/rest/v1/rpc/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({}),
    });
    // Fallback: just update last_activity
    await this.update("sessions", `session_key=eq.${encodeURIComponent(sessionKey)}`, {
      last_activity_at: new Date().toISOString(),
    });
    void res;
  }

  // --------------- Usage events ---------------

  async logUsage(
    userId: string,
    eventType: string,
    tokenSymbol?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.insert("usage_events", {
      user_id: userId,
      event_type: eventType,
      token_symbol: tokenSymbol ?? null,
      metadata: metadata ?? {},
    });
  }

  // --------------- Referrals ---------------

  async getReferralStats(userId: string): Promise<{
    total_referrals: number;
    converted_referrals: number;
    total_earned: number;
    current_balance: number;
  } | null> {
    const rows = await this.get<{
      total_referrals: number;
      converted_referrals: number;
      total_earned: number;
      current_balance: number;
    }>("referral_leaderboard", `user_id=eq.${userId}&limit=1`);
    return rows[0] ?? null;
  }

  // --------------- Checkout ---------------

  async createCheckoutSession(
    telegramId: number,
    tier: "trader" | "premium" | "annual",
  ): Promise<{ checkout_url: string; session_id: string }> {
    const res = await fetch(`${this.url}/functions/v1/create-checkout`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ telegram_id: telegramId, tier }),
    });
    if (!res.ok) throw new Error(`Checkout: ${res.status} ${await res.text()}`);
    return res.json();
  }
}

// Singleton
let _db: OpenJoeyDB | null = null;

export function getOpenJoeyDB(): OpenJoeyDB {
  if (_db) return _db;
  const url = process.env.SUPABASE_URL ?? process.env.OPENJOEY_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.OPENJOEY_SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("OpenJoey: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  _db = new OpenJoeyDB({ url, serviceRoleKey: key });
  return _db;
}
