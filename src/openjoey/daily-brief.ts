/**
 * OpenJoey daily brief: build one text-only morning message per user.
 * Market snapshot (CoinGecko), trade news (placeholder), optional personal block (watchlist + alerts).
 */

import type { Alert, OpenJoeyDB, OpenJoeyUser, WatchlistItem } from "./supabase-client.js";
import { JOEY_SIGNATURE } from "./constants.js";

export interface MarketSnapshot {
  btcPrice: number;
  btcChange24h: number | null;
  ethPrice: number;
  ethChange24h: number | null;
  dxyLine?: string;
  goldLine?: string;
}

export interface TradeNewsItem {
  title: string;
  url: string;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BONK: "bonk",
  PEPE: "pepe",
  DOGE: "dogecoin",
  XRP: "ripple",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  DOT: "polkadot",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  APT: "aptos",
  INJ: "injective-protocol",
  TIA: "celestia",
  SEI: "sei-network",
  WIF: "dogwifcoin",
  FLOKI: "floki",
  NEAR: "near",
  FIL: "filecoin",
  AAVE: "aave",
  MKR: "maker",
  CRV: "curve-dao-token",
};

/** Fetch BTC/ETH (and optional DXY/gold) for the market block. */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";
  const res = await fetch(url);
  if (!res.ok) {
    return {
      btcPrice: 0,
      btcChange24h: null,
      ethPrice: 0,
      ethChange24h: null,
    };
  }
  const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  return {
    btcPrice: data.bitcoin?.usd ?? 0,
    btcChange24h: data.bitcoin?.usd_24h_change ?? null,
    ethPrice: data.ethereum?.usd ?? 0,
    ethChange24h: data.ethereum?.usd_24h_change ?? null,
    dxyLine: "DXY and gold: check [TradingView](https://www.tradingview.com) for latest.",
    goldLine: undefined,
  };
}

/** Fetch a short list of trade-relevant headlines with links. v1: placeholder or simple RSS. */
export async function fetchTradeNews(): Promise<TradeNewsItem[]> {
  // v1: static placeholder so pipeline works; replace with News API / RSS later
  const placeholder: TradeNewsItem[] = [
    { title: "Fed & rates", url: "https://www.federalreserve.gov" },
    { title: "Crypto headlines", url: "https://www.coindesk.com" },
    { title: "Markets overview", url: "https://www.reuters.com/markets" },
  ];
  return placeholder;
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
  if (c == null) return "";
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
