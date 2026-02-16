/**
 * OpenJoey Whale Service - Large Transaction Monitoring
 * Tracks whale wallets, large transactions, exchange flows
 * Outputs: whale_events records
 */

import { getOpenJoeyDB } from "../../supabase-client.js";

export interface WhaleEvent {
  asset_symbol: string;
  event_type:
    | "large_transfer"
    | "exchange_inflow"
    | "exchange_outflow"
    | "accumulation"
    | "distribution";
  amount: number;
  amount_usd: number;
  from_address?: string;
  to_address?: string;
  confidence: number;
  notes?: string;
  timestamp: string;
}

/**
 * Monitor whale activity for an asset
 */
export async function monitorWhaleActivity(symbol: string): Promise<WhaleEvent[]> {
  const events: WhaleEvent[] = [];
  const now = new Date().toISOString();

  // Simulate whale detection (in production: integrate with blockchain APIs)
  // Generate 0-3 whale events per check
  const numEvents = Math.floor(Math.random() * 4);

  for (let i = 0; i < numEvents; i++) {
    const eventType = generateRandomEventType();
    const amount = generateRandomAmount(symbol);
    const amountUsd = amount * getMockPrice(symbol);

    // Only record significant amounts (> $100k)
    if (amountUsd >= 100000) {
      events.push({
        asset_symbol: symbol,
        event_type: eventType,
        amount: parseFloat(amount.toFixed(4)),
        amount_usd: Math.floor(amountUsd),
        from_address: generateRandomAddress(),
        to_address: generateRandomAddress(),
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        notes: generateEventNotes(eventType, amountUsd),
        timestamp: now,
      });
    }
  }

  // Store events
  for (const event of events) {
    await storeWhaleEvent(event);
  }

  return events;
}

/**
 * Generate random event type
 */
function generateRandomEventType(): WhaleEvent["event_type"] {
  const types: WhaleEvent["event_type"][] = [
    "large_transfer",
    "exchange_inflow",
    "exchange_outflow",
    "accumulation",
    "distribution",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Generate random amount based on asset
 */
function generateRandomAmount(symbol: string): number {
  const baseAmounts: Record<string, number> = {
    BTC: 100,
    ETH: 1000,
    SOL: 5000,
    RAY: 50000,
    AVAX: 2000,
    MATIC: 100000,
    DOT: 5000,
    LINK: 10000,
  };

  const base = baseAmounts[symbol] || 1000;
  return base * (0.5 + Math.random() * 2); // 50% - 250% of base
}

/**
 * Get mock price for asset
 */
function getMockPrice(symbol: string): number {
  const prices: Record<string, number> = {
    BTC: 45000,
    ETH: 2800,
    SOL: 95,
    RAY: 1.5,
    AVAX: 35,
    MATIC: 0.85,
    DOT: 7.5,
    LINK: 15,
  };

  return prices[symbol] || 10;
}

/**
 * Generate random blockchain address
 */
function generateRandomAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate event notes
 */
function generateEventNotes(eventType: string, amountUsd: number): string {
  const size = amountUsd > 1000000 ? "massive" : amountUsd > 500000 ? "large" : "significant";

  switch (eventType) {
    case "exchange_inflow":
      return `${size} amount moved to exchange - potential selling pressure`;
    case "exchange_outflow":
      return `${size} amount withdrawn from exchange - potential accumulation`;
    case "accumulation":
      return `${size} accumulation pattern detected`;
    case "distribution":
      return `${size} distribution pattern detected`;
    default:
      return `${size} transfer between wallets`;
  }
}

/**
 * Store whale event in database
 */
async function storeWhaleEvent(event: WhaleEvent): Promise<void> {
  try {
    const db = getOpenJoeyDB();
    await db.insert("whale_events", {
      asset_symbol: event.asset_symbol,
      event_type: event.event_type,
      amount: event.amount,
      amount_usd: event.amount_usd,
      from_address: event.from_address,
      to_address: event.to_address,
      confidence: event.confidence,
      notes: event.notes,
      created_at: event.timestamp,
    });
  } catch (error) {
    console.error("Error storing whale event:", error);
  }
}

/**
 * Get recent whale events
 */
export async function getRecentWhaleEvents(
  symbol?: string,
  limit: number = 20,
): Promise<WhaleEvent[]> {
  try {
    const db = getOpenJoeyDB();

    let query = "";
    if (symbol) {
      query = `asset_symbol=eq.${symbol}&order=created_at.desc&limit=${limit}`;
    } else {
      query = `order=created_at.desc&limit=${limit}`;
    }

    const data = await db.get("whale_events", query);

    return (data || []).map((e: any) => ({
      asset_symbol: e.asset_symbol,
      event_type: e.event_type,
      amount: e.amount,
      amount_usd: e.amount_usd,
      from_address: e.from_address,
      to_address: e.to_address,
      confidence: e.confidence,
      notes: e.notes,
      timestamp: e.created_at,
    }));
  } catch (error) {
    console.error("Error fetching whale events:", error);
    return [];
  }
}

/**
 * Get whale statistics
 */
export async function getWhaleStats(symbol: string): Promise<{
  total_volume_24h: number;
  event_count_24h: number;
  net_flow: number;
  top_events: WhaleEvent[];
}> {
  const events = await getRecentWhaleEvents(symbol, 50);

  const totalVolume = events.reduce((sum, e) => sum + e.amount_usd, 0);
  const netFlow = events.reduce((sum, e) => {
    if (e.event_type === "exchange_outflow" || e.event_type === "accumulation") {
      return sum + e.amount_usd;
    } else if (e.event_type === "exchange_inflow" || e.event_type === "distribution") {
      return sum - e.amount_usd;
    }
    return sum;
  }, 0);

  return {
    total_volume_24h: totalVolume,
    event_count_24h: events.length,
    net_flow: netFlow,
    top_events: events.slice(0, 5),
  };
}

/**
 * Auto-monitor top assets for whale activity
 */
export async function autoMonitorWhales(): Promise<void> {
  const symbols = ["BTC", "ETH", "SOL", "RAY", "AVAX"];

  console.log("Monitoring whale activity...");

  for (const symbol of symbols) {
    try {
      const events = await monitorWhaleActivity(symbol);
      if (events.length > 0) {
        console.log(`Detected ${events.length} whale events for ${symbol}`);
      }

      // Add delay between checks
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error monitoring ${symbol}:`, error);
    }
  }

  console.log("Whale monitoring complete");
}
