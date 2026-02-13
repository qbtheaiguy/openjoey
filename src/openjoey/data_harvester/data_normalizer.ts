/**
 * Data Normalizer for OpenJoey Data Harvester
 * Rule 4: Structured data output from various sources
 */

export type NormalizedRow = {
  source: string;
  metric: string;
  value: number | string;
  timestamp: string;
  symbol?: string;
  currency?: string;
  change24h?: number;
  changePercent24h?: number;
  volume?: number;
  marketCap?: number;
};

/**
 * Normalize CoinGecko price data
 */
export function normalizeCoinGeckoData(
  data: Array<{
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h?: number;
    price_change_percentage_24h?: number;
    total_volume?: number;
    market_cap?: number;
    last_updated: string;
  }>,
): NormalizedRow[] {
  return data.map((coin) => ({
    source: "coingecko",
    metric: "price",
    value: coin.current_price,
    timestamp: coin.last_updated,
    symbol: coin.symbol.toUpperCase(),
    currency: "USD",
    change24h: coin.price_change_24h,
    changePercent24h: coin.price_change_percentage_24h,
    volume: coin.total_volume,
    marketCap: coin.market_cap,
  }));
}

/**
 * Normalize stock data from various sources
 */
export function normalizeStockData(
  data: Array<{
    symbol: string;
    price: number;
    change?: number;
    changePercent?: number;
    volume?: number;
    timestamp?: string;
  }>,
  source: string,
): NormalizedRow[] {
  const now = new Date().toISOString();

  return data.map((stock) => ({
    source,
    metric: "price",
    value: stock.price,
    timestamp: stock.timestamp ?? now,
    symbol: stock.symbol.toUpperCase(),
    currency: "USD",
    change24h: stock.change,
    changePercent24h: stock.changePercent,
    volume: stock.volume,
  }));
}

/**
 * Normalize FRED economic data
 */
export function normalizeFREDData(
  seriesId: string,
  data: Array<{ date: string; value: number | null }>,
): NormalizedRow[] {
  return data
    .filter((d) => d.value !== null)
    .map((obs) => ({
      source: `fred:${seriesId}`,
      metric: "observation",
      value: obs.value as number,
      timestamp: obs.date,
    }));
}

/**
 * Generic normalize function that detects source type
 */
export function normalize(data: unknown[], source: string): NormalizedRow[] {
  if (source.includes("coingecko")) {
    return normalizeCoinGeckoData(data as Parameters<typeof normalizeCoinGeckoData>[0]);
  }

  if (source.includes("fred")) {
    // For FRED, we need seriesId separately - this is a simplified version
    return normalizeFREDData(
      source.replace("fred:", ""),
      data as Array<{ date: string; value: number | null }>,
    );
  }

  // Default: treat as stock data
  return normalizeStockData(
    data as Array<{
      symbol: string;
      price: number;
      change?: number;
      changePercent?: number;
      volume?: number;
    }>,
    source,
  );
}

/**
 * Aggregate normalized data by symbol
 */
export function aggregateBySymbol(data: NormalizedRow[]): Map<string, NormalizedRow[]> {
  const grouped = new Map<string, NormalizedRow[]>();

  for (const row of data) {
    if (row.symbol) {
      const existing = grouped.get(row.symbol) ?? [];
      existing.push(row);
      grouped.set(row.symbol, existing);
    }
  }

  return grouped;
}

/**
 * Get latest value for each symbol
 */
export function getLatestBySymbol(data: NormalizedRow[]): NormalizedRow[] {
  const grouped = aggregateBySymbol(data);
  const latest: NormalizedRow[] = [];

  for (const [, rows] of grouped) {
    // Sort by timestamp descending and take first
    const sorted = rows.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    if (sorted[0]) {
      latest.push(sorted[0]);
    }
  }

  return latest;
}
