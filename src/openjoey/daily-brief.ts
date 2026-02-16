/**
 * OpenJoey Daily Brief - Rule 10: Morning Trading Brief
 * Generates comprehensive market brief with real data integration
 */

import type { Alert, OpenJoeyDB, OpenJoeyUser } from "./supabase-client.js";
import { JOEY_SIGNATURE } from "./constants.js";
import { fetchCoinGeckoPrices, getOrCompute } from "./data_harvester/index.js";

export interface MarketSnapshot {
  btcPrice: number;
  btcChange24h: number | null;
  ethPrice: number;
  ethChange24h: number | null;
  topMovers: Array<{ symbol: string; changePercent: number; price: number }>;
  dxyLine?: string;
  goldLine?: string;
}

export interface TradeNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface WhaleAlert {
  symbol: string;
  amount: number;
  valueUsd: number;
  type: "inflow" | "outflow";
  exchange?: string;
}

/**
 * Fetch comprehensive market snapshot with data harvester
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  // Use cache for 5 minutes
  const prices = await getOrCompute(
    "daily_brief_prices",
    async () => {
      const data = await fetchCoinGeckoPrices(20);
      return data ?? [];
    },
    5,
  );

  // Extract BTC/ETH
  const btc = prices.find((p) => p.symbol === "btc");
  const eth = prices.find((p) => p.symbol === "eth");

  // Calculate top movers (excluding stablecoins)
  const stablecoins = new Set(["usdt", "usdc", "dai", "busd"]);
  const topMovers = prices
    .filter((p) => !stablecoins.has(p.symbol))
    .map((p) => ({
      symbol: p.symbol.toUpperCase(),
      changePercent: p.price_change_percentage_24h ?? 0,
      price: p.current_price,
    }))
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  return {
    btcPrice: btc?.current_price ?? 0,
    btcChange24h: btc?.price_change_percentage_24h ?? null,
    ethPrice: eth?.current_price ?? 0,
    ethChange24h: eth?.price_change_percentage_24h ?? null,
    topMovers,
    dxyLine: "Check [TradingView](https://www.tradingview.com) for DXY and Gold",
  };
}

/**
 * Fetch whale alerts (mock - production would use blockchain APIs)
 */
export async function fetchWhaleAlerts(): Promise<WhaleAlert[]> {
  // Mock whale alerts - in production, use Whale Alert API or blockchain RPC
  return [
    { symbol: "BTC", amount: 500, valueUsd: 22500000, type: "outflow", exchange: "Binance" },
    { symbol: "ETH", amount: 10000, valueUsd: 30000000, type: "inflow", exchange: "Coinbase" },
  ];
}

/**
 * Fetch macro events (mock - production would use economic calendar APIs)
 */
export async function fetchMacroEvents(): Promise<
  Array<{ date: string; event: string; impact: "high" | "medium" | "low" }>
> {
  return [
    {
      date: new Date().toISOString().split("T")[0],
      event: "Fed Interest Rate Decision",
      impact: "high",
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      event: "CPI Data Release",
      impact: "high",
    },
  ];
}

/**
 * Build complete morning brief message
 */
export async function buildMorningBrief(
  user: OpenJoeyUser,
  db: OpenJoeyDB,
  alerts: Alert[],
): Promise<string> {
  const [market, whales, macro] = await Promise.all([
    fetchMarketSnapshot(),
    fetchWhaleAlerts(),
    fetchMacroEvents(),
  ]);

  const lines: string[] = [
    `${JOEY_SIGNATURE} Morning Brief for ${user.display_name ?? user.telegram_username ?? "Trader"}`,
    "",
  ];

  // Market Overview
  lines.push("📊 Market Overview");
  lines.push(`BTC: $${market.btcPrice.toLocaleString()} ${formatChange(market.btcChange24h)}`);
  lines.push(`ETH: $${market.ethPrice.toLocaleString()} ${formatChange(market.ethChange24h)}`);
  lines.push("");

  // Top Movers
  if (market.topMovers.length > 0) {
    lines.push("🔥 Top Movers (24h)");
    for (const mover of market.topMovers.slice(0, 3)) {
      lines.push(
        `  ${mover.symbol}: ${mover.changePercent > 0 ? "+" : ""}${mover.changePercent.toFixed(2)}%`,
      );
    }
    lines.push("");
  }

  // Whale Activity
  if (whales.length > 0) {
    lines.push("🐋 Whale Activity");
    for (const whale of whales.slice(0, 2)) {
      lines.push(`  ${whale.symbol}: ${formatWhaleAlert(whale)}`);
    }
    lines.push("");
  }

  // Macro Events
  if (macro.length > 0) {
    lines.push("📅 Upcoming Macro Events");
    for (const event of macro) {
      lines.push(`  ${event.date}: ${event.event} ${event.impact === "high" ? "🔴" : "🟡"}`);
    }
    lines.push("");
  }

  // Personal Alerts
  if (alerts.length > 0) {
    lines.push("🔔 Your Alerts");
    for (const alert of alerts.slice(0, 3)) {
      lines.push(`  ${alert.token_symbol}: ${alert.condition}`);
    }
    lines.push("");
  }

  lines.push(`Data updated: ${new Date().toLocaleTimeString()}`);
  lines.push(market.dxyLine ?? "");

  return lines.join("\n");
}

function formatChange(change: number | null): string {
  if (change === null) return "";
  const emoji = change >= 0 ? "📈" : "📉";
  const sign = change >= 0 ? "+" : "";
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}

function formatWhaleAlert(whale: WhaleAlert): string {
  const direction = whale.type === "inflow" ? "→" : "←";
  const exchange = whale.exchange ? ` (${whale.exchange})` : "";
  return `${direction} ${whale.amount.toLocaleString()} ${whale.symbol}${exchange} ($${(whale.valueUsd / 1e6).toFixed(1)}M)`;
}

/** Alerts triggered in the last 12 hours (UTC). */
function alertsTriggeredOvernight(alerts: Alert[], since: Date): Alert[] {
  return alerts.filter((a) => {
    const t = a.triggered_at ? new Date(a.triggered_at) : null;
    return t && t >= since;
  });
}

/** Format 24h change for display. */
function fmtChange(c: number | null): string {
  if (c == null) {
    return "";
  }
  const sign = c >= 0 ? "+" : "";
  return " (" + sign + c.toFixed(2) + "%)";
}

/** Escape for Telegram HTML: & < > */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build one brief for a user (personal + market + news + signature + footer). Uses HTML so link text like "Fed & rates" and apostrophes don't break Telegram. */
export async function buildBriefForUser(
  db: OpenJoeyDB,
  user: OpenJoeyUser,
  market: MarketSnapshot,
  news: TradeNewsItem[],
): Promise<{ text: string; parse_mode: "HTML" }> {
  const dateLine = new Date().toISOString().slice(0, 10);
  const lines: string[] = ["\u{1F4F0} <b>Your brief — " + dateLine + "</b>", ""];

  const watchlist = await db.getUserWatchlist(user.id).catch(() => []);
  const allAlerts = await db.getUserAlerts(user.id, false).catch(() => []);
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const triggered = alertsTriggeredOvernight(allAlerts, twelveHoursAgo);

  if (watchlist.length > 0 || triggered.length > 0) {
    lines.push("🔹 <b>Your overnight</b>");
    if (watchlist.length > 0) {
      const symbols = watchlist.map((w) => w.symbol).slice(0, 10);
      lines.push(
        "• Watchlist: " + esc(symbols.join(", ")) + ". <i>(Add price moves when API is wired)</i>",
      );
    }
    if (triggered.length > 0) {
      const desc = triggered
        .slice(0, 5)
        .map((a) => {
          const timePart = a.triggered_at
            ? " at " + new Date(a.triggered_at).toISOString().slice(11, 16) + " UTC"
            : "";
          return esc(a.token_symbol) + " " + a.condition + " $" + a.target_price + timePart;
        })
        .join("; ");
      lines.push("• Alerts: " + desc + ".");
    } else if (watchlist.length > 0) {
      lines.push("• Alerts: None triggered.");
    }
    lines.push("");
  }

  lines.push("🔹 <b>Market</b>");
  const btc = market.btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const eth = market.ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 });
  lines.push(
    "• BTC $" +
      btc +
      fmtChange(market.btcChange24h) +
      ", ETH $" +
      eth +
      fmtChange(market.ethChange24h) +
      ".",
  );
  if (market.dxyLine) {
    lines.push(
      '• DXY and gold: check <a href="https://www.tradingview.com">TradingView</a> for latest.',
    );
  }
  lines.push("");

  lines.push("🔹 <b>Trade news</b>");
  for (const item of news.slice(0, 5)) {
    lines.push('• <a href="' + esc(item.url) + '">' + esc(item.title) + "</a>");
  }
  lines.push("");

  lines.push("<i>Joey's take: Check the links above for the latest.</i>");
  lines.push("");
  lines.push(JOEY_SIGNATURE);
  lines.push("");
  lines.push("Pause or change time: /brief_settings");

  return { text: lines.join("\n"), parse_mode: "HTML" };
}
