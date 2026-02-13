/**
 * Trading news from RSS: crypto, stocks, Fed, gold, forex. Fast parallel fetch for daily brief and agent.
 */

import { XMLParser } from "fast-xml-parser";

export interface TradeNewsItem {
  title: string;
  url: string;
  publishedAt?: Date;
  source?: string;
}

/** Default RSS feed URLs: Fed, crypto, markets, gold, forex. All public, no API key. */
export const DEFAULT_TRADE_FEEDS: { url: string; label: string }[] = [
  { url: "https://www.federalreserve.gov/feeds/press_all.xml", label: "Fed" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", label: "Coindesk" },
  { url: "https://cryptonews.com/news/feed/", label: "CryptoNews" },
  { url: "https://www.kitco.com/rss/", label: "Kitco" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", label: "MarketWatch" },
  { url: "https://www.investing.com/rss/news_285.rss", label: "Investing.com" },
];

const FETCH_TIMEOUT_MS = 8_000;
const PER_FEED_TIMEOUT_MS = 5_000;
const MAX_ITEMS_PER_FEED = 8;
const MAX_TOTAL_ITEMS = 20;

function parseRssXml(xml: string, sourceLabel: string): TradeNewsItem[] {
  const items: TradeNewsItem[] = [];
  try {
    const parser = new XMLParser({ ignoreDeclaration: true });
    const parsed = parser.parse(xml) as Record<string, unknown>;
    const rss = parsed?.rss as Record<string, unknown> | undefined;
    const feed = parsed?.feed as Record<string, unknown> | undefined;
    const raw = rss?.channel ?? feed;
    const channel =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null;
    if (!channel) {
      return items;
    }

    // RSS 2.0: channel.item (array or single)
    let entries: Array<Record<string, unknown>> = [];
    if (channel.item) {
      entries = Array.isArray(channel.item)
        ? channel.item
        : [channel.item as Record<string, unknown>];
    }
    // Atom: feed.entry
    if (channel.entry) {
      entries = Array.isArray(channel.entry)
        ? channel.entry
        : [channel.entry as Record<string, unknown>];
    }

    for (const entry of entries.slice(0, MAX_ITEMS_PER_FEED)) {
      let title = typeof entry.title === "string" ? entry.title.trim() : "";
      try {
        title = title
          .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
            String.fromCodePoint(Number.parseInt(hex, 16)),
          )
          .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
      } catch {
        // keep original
      }
      let link = typeof entry.link === "string" ? entry.link.trim() : "";
      if (!link && entry.link && typeof entry.link === "object") {
        const l = entry.link as Record<string, unknown>;
        const rawHref = l.href ?? l["@_href"] ?? "";
        link = typeof rawHref === "string" ? rawHref.trim() : "";
      }
      if (!title || !link) {
        continue;
      }
      const dateStr = entry.pubDate ?? entry.updated ?? entry.published;
      const publishedAt =
        typeof dateStr === "string" || typeof dateStr === "number" ? new Date(dateStr) : undefined;
      if (publishedAt instanceof Date && isNaN(publishedAt.getTime())) {
        continue;
      }
      items.push({ title, url: link, publishedAt, source: sourceLabel });
    }
  } catch {
    // Ignore parse errors per feed
  }
  return items;
}

async function fetchOneFeed(
  url: string,
  label: string,
  parentSignal: AbortSignal,
): Promise<TradeNewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PER_FEED_TIMEOUT_MS);
  parentSignal.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return [];
    }
    const xml = await res.text();
    return parseRssXml(xml, label);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/** Fetch all feeds in parallel. */
export async function fetchTradeNews(): Promise<TradeNewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const results = await Promise.all(
      DEFAULT_TRADE_FEEDS.map((f) => fetchOneFeed(f.url, f.label, controller.signal)),
    );
    clearTimeout(timeout);
    const all = results.flat();

    const seenUrls = new Set<string>();
    const unique: TradeNewsItem[] = [];
    for (const item of all) {
      if (seenUrls.has(item.url)) {
        continue;
      }
      seenUrls.add(item.url);
      unique.push(item);
    }

    unique.sort((a, b) => {
      const ta = a.publishedAt?.getTime() ?? 0;
      const tb = b.publishedAt?.getTime() ?? 0;
      return tb - ta;
    });

    return unique.slice(0, MAX_TOTAL_ITEMS);
  } catch (err) {
    console.error("[openjoey] fetchTradeNews failed:", err);
    clearTimeout(timeout);
    return [];
  }
}
