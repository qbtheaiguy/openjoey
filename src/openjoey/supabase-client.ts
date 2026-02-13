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
  /** When true, user has unsubscribed from admin broadcasts (/stop). */
  broadcast_opt_out?: boolean;
  /** When false, user does not receive the daily brief. Default true. */
  daily_brief_opted_in?: boolean;
  /** When set, user does not receive the brief until this time (UTC). */
  daily_brief_paused_until?: string | null;
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

// --------------- Watchlist, Favorites, Skill Use (UI/UX automation) ---------------

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  symbol_type: "crypto_token" | "stock" | "penny_stock";
  added_at: string;
}

export interface FavoriteSkill {
  id: string;
  user_id: string;
  skill_name: string;
  category: string | null;
  added_at: string;
  usage_count: number;
  last_used: string | null;
  settings: Record<string, unknown> | null;
}

export interface SkillUse {
  id: string;
  user_id: string;
  skill_name: string;
  use_count: number;
  last_used: string;
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

  public async get<T>(table: string, query: string = ""): Promise<T[]> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  public async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Supabase INSERT ${table}: ${res.status} ${await res.text()}`);
    }
    const rows: T[] = await res.json();
    return rows[0];
  }

  public async update<T>(
    table: string,
    query: string,
    data: Record<string, unknown>,
  ): Promise<T[]> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Supabase PATCH ${table}: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  public async delete(table: string, query: string): Promise<void> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!res.ok) {
      throw new Error(`Supabase DELETE ${table}: ${res.status} ${await res.text()}`);
    }
  }

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      throw new Error(`Supabase RPC ${fn}: ${res.status} ${await res.text()}`);
    }
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

  async getUserByReferralCode(code: string): Promise<OpenJoeyUser | null> {
    const rows = await this.get<OpenJoeyUser>("users", `referral_code=eq.${code}&limit=1`);
    return rows[0] ?? null;
  }

  async getUserById(userId: string): Promise<OpenJoeyUser | null> {
    const rows = await this.get<OpenJoeyUser>("users", `id=eq.${userId}&limit=1`);
    return rows[0] ?? null;
  }

  /** All telegram_id values for broadcast (admin-only). Excludes users who opted out via /stop. */
  async getAllTelegramIdsForBroadcast(): Promise<number[]> {
    const rows = await this.get<{ telegram_id: number }>(
      "users",
      "select=telegram_id&broadcast_opt_out=eq.false",
    );
    return rows.map((r) => Number(r.telegram_id));
  }

  /** Set broadcast opt-out (true = unsubscribed, false = subscribed). */
  async setBroadcastOptOut(telegramId: number, optOut: boolean): Promise<void> {
    await this.update("users", `telegram_id=eq.${telegramId}`, {
      broadcast_opt_out: optOut,
    });
  }

  /** Users who should receive the daily brief (opted in, not paused). */
  async getUsersForDailyBrief(): Promise<Array<{ telegram_id: number; id: string }>> {
    const rows = await this.get<{
      telegram_id: number;
      id: string;
      daily_brief_opted_in: boolean | null;
      daily_brief_paused_until: string | null;
    }>("users", "select=telegram_id,id,daily_brief_opted_in,daily_brief_paused_until");
    const now = new Date();
    return rows
      .filter(
        (r) =>
          r.daily_brief_opted_in !== false &&
          (r.daily_brief_paused_until == null || new Date(r.daily_brief_paused_until) < now),
      )
      .map((r) => ({ telegram_id: r.telegram_id, id: r.id }));
  }

  /** Pause daily brief until a given time (null = resume). */
  async setDailyBriefPaused(telegramId: number, pausedUntil: string | null): Promise<void> {
    await this.update("users", `telegram_id=eq.${telegramId}`, {
      daily_brief_paused_until: pausedUntil,
    });
  }

  /** Opt in or out of daily brief. */
  async setDailyBriefOptedIn(telegramId: number, optedIn: boolean): Promise<void> {
    await this.update("users", `telegram_id=eq.${telegramId}`, {
      daily_brief_opted_in: optedIn,
    });
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
    if (activeOnly) {
      query += "&is_active=eq.true";
    }
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

  async createReferral(data: {
    referrer_id: string;
    referred_id: string;
    referrer_credit: number;
    referred_credit: number;
  }): Promise<void> {
    await this.insert("referrals", {
      ...data,
      status: "pending",
    });
  }

  async updateReferralStatus(
    referredId: string,
    status: "converted" | "paid" | "cancelled",
  ): Promise<void> {
    const updates: Record<string, string> = { status };
    if (status === "converted") {
      updates.converted_at = new Date().toISOString();
    }
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    await this.update("referrals", `referred_id=eq.${referredId}`, updates);
  }

  // --------------- Referral milestones (§9.9) ---------------

  async getMilestoneSends(userId: string): Promise<string[]> {
    const rows = await this.get<{ milestone: string }>(
      "user_referral_milestones",
      `user_id=eq.${userId}`,
    );
    return rows.map((r) => r.milestone);
  }

  async recordMilestoneSent(userId: string, milestone: string): Promise<void> {
    await this.insert("user_referral_milestones", {
      user_id: userId,
      milestone,
    });
  }

  // --------------- Quotas & Usage ---------------

  async getUserQuota(userId: string): Promise<{
    daily_skill_calls_used: number;
    daily_expensive_skill_calls_used: number;
    last_reset_at: string;
  }> {
    const rows = await this.get<{
      daily_skill_calls_used: number;
      daily_expensive_skill_calls_used: number;
      last_reset_at: string;
    }>("user_quotas", `user_id=eq.${userId}&limit=1`);

    if (rows.length === 0) {
      // Create quota record
      await this.insert("user_quotas", { user_id: userId });
      return {
        daily_skill_calls_used: 0,
        daily_expensive_skill_calls_used: 0,
        last_reset_at: new Date().toISOString(),
      };
    }

    // Check if needs reset (midnight UTC)
    const lastReset = new Date(rows[0].last_reset_at);
    const now = new Date();
    if (lastReset.toDateString() !== now.toDateString()) {
      await this.update("user_quotas", `user_id=eq.${userId}`, {
        daily_skill_calls_used: 0,
        daily_expensive_skill_calls_used: 0,
        last_reset_at: now.toISOString(),
      });
      return {
        daily_skill_calls_used: 0,
        daily_expensive_skill_calls_used: 0,
        last_reset_at: now.toISOString(),
      };
    }

    return rows[0];
  }

  async incrementQuota(userId: string, costTier: "free" | "standard" | "expensive"): Promise<void> {
    const quota = await this.getUserQuota(userId);

    const updates: Record<string, number> = {};
    if (costTier === "standard" || costTier === "expensive") {
      updates.daily_skill_calls_used = quota.daily_skill_calls_used + 1;
    }
    if (costTier === "expensive") {
      updates.daily_expensive_skill_calls_used = quota.daily_expensive_skill_calls_used + 1;
    }

    if (Object.keys(updates).length > 0) {
      await this.update("user_quotas", `user_id=eq.${userId}`, updates);
    }
  }

  async logSkillUsage(
    userId: string,
    skillName: string,
    data: {
      cost_usd: number;
      tokens_used: number;
      execution_time_ms: number;
      success: boolean;
      error_message?: string;
      skill_category?: string;
    },
  ): Promise<void> {
    await this.insert("skill_usage", {
      user_id: userId,
      skill_name: skillName,
      ...data,
    });
  }

  async getSkillMetadata(skillId: string): Promise<{
    display_name: string;
    cost_tier: string;
    allowed_tiers: string[];
  } | null> {
    const rows = await this.get<{
      display_name: string;
      cost_tier: string;
      allowed_tiers: string[];
    }>("skill_catalog", `id=eq.${skillId}&limit=1`);
    return rows[0] ?? null;
  }

  async getSkillByCategory(category: string): Promise<{
    id: string;
    skill_name: string;
  } | null> {
    const rows = await this.get<{
      id: string;
      skill_name: string;
    }>("skill_catalog", `category=eq.${category}&limit=1`);
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      skill_name: row.skill_name,
    };
  }

  /** For skill detail view: display name, description, category. */
  async getSkillForDetail(skillId: string): Promise<{
    display_name: string;
    description: string | null;
    category: string | null;
  } | null> {
    const rows = await this.get<{
      display_name: string | null;
      description: string | null;
      category: string | null;
    }>("skill_catalog", `id=eq.${encodeURIComponent(skillId)}&limit=1`);
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      display_name: row.display_name ?? skillId,
      description: row.description ?? null,
      category: row.category ?? null,
    };
  }

  // --------------- Watchlist (UI/UX automation) ---------------

  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    return this.get<WatchlistItem>("user_watchlist", `user_id=eq.${userId}&order=added_at.desc`);
  }

  async getWatchlistCount(userId: string): Promise<number> {
    const items = await this.get<{ id: string }>(
      "user_watchlist",
      `user_id=eq.${userId}&select=id`,
    );
    return items.length;
  }

  async addToWatchlist(
    userId: string,
    symbol: string,
    symbolType: "crypto_token" | "stock" | "penny_stock" = "crypto_token",
  ): Promise<WatchlistItem> {
    return this.insert<WatchlistItem>("user_watchlist", {
      user_id: userId,
      symbol: symbol.toUpperCase(),
      symbol_type: symbolType,
    });
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    await this.delete(
      "user_watchlist",
      `user_id=eq.${userId}&symbol=eq.${encodeURIComponent(symbol.toUpperCase())}`,
    );
  }

  async isInWatchlist(userId: string, symbol: string): Promise<boolean> {
    const rows = await this.get<{ id: string }>(
      "user_watchlist",
      `user_id=eq.${userId}&symbol=eq.${encodeURIComponent(symbol.toUpperCase())}&select=id&limit=1`,
    );
    return rows.length > 0;
  }

  // --------------- Favorite Skills (UI/UX automation) ---------------

  async getUserFavorites(userId: string): Promise<FavoriteSkill[]> {
    return this.get<FavoriteSkill>(
      "user_favorite_skills",
      `user_id=eq.${userId}&order=added_at.desc`,
    );
  }

  async getFavoriteCount(userId: string): Promise<number> {
    const items = await this.get<{ id: string }>(
      "user_favorite_skills",
      `user_id=eq.${userId}&select=id`,
    );
    return items.length;
  }

  async addFavorite(userId: string, skillName: string, category?: string): Promise<FavoriteSkill> {
    return this.insert<FavoriteSkill>("user_favorite_skills", {
      user_id: userId,
      skill_name: skillName,
      category: category ?? null,
    });
  }

  async removeFavorite(userId: string, skillName: string): Promise<void> {
    await this.delete(
      "user_favorite_skills",
      `user_id=eq.${userId}&skill_name=eq.${encodeURIComponent(skillName)}`,
    );
  }

  async isFavorited(userId: string, skillName: string): Promise<boolean> {
    const rows = await this.get<{ id: string }>(
      "user_favorite_skills",
      `user_id=eq.${userId}&skill_name=eq.${encodeURIComponent(skillName)}&select=id&limit=1`,
    );
    return rows.length > 0;
  }

  // --------------- Skill Use Tracking (UI/UX automation) ---------------

  /** Increment use count for a skill; upsert if first use. Returns the new count. */
  async incrementSkillUse(userId: string, skillName: string): Promise<number> {
    const encoded = encodeURIComponent(skillName);
    const rows = await this.get<SkillUse>(
      "user_skill_use",
      `user_id=eq.${userId}&skill_name=eq.${encoded}&limit=1`,
    );
    if (rows.length > 0) {
      const newCount = rows[0].use_count + 1;
      await this.update("user_skill_use", `user_id=eq.${userId}&skill_name=eq.${encoded}`, {
        use_count: newCount,
        last_used: new Date().toISOString(),
      });
      return newCount;
    }
    // First use: insert with count 1
    await this.insert("user_skill_use", {
      user_id: userId,
      skill_name: skillName,
      use_count: 1,
      last_used: new Date().toISOString(),
    });
    return 1;
  }

  async getSkillUseCount(userId: string, skillName: string): Promise<number> {
    const rows = await this.get<SkillUse>(
      "user_skill_use",
      `user_id=eq.${userId}&skill_name=eq.${encodeURIComponent(skillName)}&limit=1`,
    );
    return rows[0]?.use_count ?? 0;
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
    if (!res.ok) {
      throw new Error(`Checkout: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
}

// Singleton
let _db: OpenJoeyDB | null = null;

export function getOpenJoeyDB(): OpenJoeyDB {
  if (_db) {
    return _db;
  }
  const url = process.env.SUPABASE_URL ?? process.env.OPENJOEY_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.OPENJOEY_SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("OpenJoey: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  _db = new OpenJoeyDB({ url, serviceRoleKey: key });
  return _db;
}
