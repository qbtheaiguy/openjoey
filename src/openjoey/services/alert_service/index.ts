/**
 * OpenJoey Alert Service V1 - Smart Alert System
 * Price alerts, signal alerts, volume alerts, whale alerts
 * Integrates with Telegram for notifications
 */

import { getOpenJoeyDB } from "../../supabase-client.js";

export interface Alert {
  id?: string;
  user_id: string;
  alert_type: "price" | "signal" | "volume" | "whale";
  asset_symbol: string;
  condition: "above" | "below" | "crosses";
  threshold: number;
  is_active: boolean;
  triggered_at?: string;
  created_at?: string;
}

export interface AlertTrigger {
  alert: Alert;
  current_value: number;
  message: string;
  should_notify: boolean;
}

/**
 * Create a new alert
 */
export async function createAlert(
  userId: string,
  alertType: Alert["alert_type"],
  symbol: string,
  condition: Alert["condition"],
  threshold: number,
): Promise<Alert | null> {
  try {
    const db = getOpenJoeyDB();

    const alert = await db.insert("alerts", {
      user_id: userId,
      alert_type: alertType,
      asset_symbol: symbol,
      condition: condition,
      threshold: threshold,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    return alert as unknown as Alert;
  } catch (error) {
    console.error("Error creating alert:", error);
    return null;
  }
}

/**
 * Get user's active alerts
 */
export async function getUserAlerts(userId: string): Promise<Alert[]> {
  try {
    const db = getOpenJoeyDB();
    const alerts = await db.get(
      "alerts",
      `user_id=eq.${userId}&is_active=eq.true&order=created_at.desc`,
    );

    return (alerts || []).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      alert_type: a.alert_type,
      asset_symbol: a.asset_symbol,
      condition: a.condition,
      threshold: a.threshold,
      is_active: a.is_active,
      triggered_at: a.triggered_at,
      created_at: a.created_at,
    }));
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
}

/**
 * Check price alerts
 */
export async function checkPriceAlerts(
  symbol: string,
  currentPrice: number,
): Promise<AlertTrigger[]> {
  const db = getOpenJoeyDB();
  const triggers: AlertTrigger[] = [];

  try {
    // Get active price alerts for this symbol
    const alerts = (await db.get(
      "alerts",
      `asset_symbol=eq.${symbol}&alert_type=eq.price&is_active=eq.true`,
    )) as any[];

    for (const alert of alerts) {
      let shouldTrigger = false;

      if (alert.condition === "above" && currentPrice > alert.threshold) {
        shouldTrigger = true;
      } else if (alert.condition === "below" && currentPrice < alert.threshold) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        triggers.push({
          alert: alert as Alert,
          current_value: currentPrice,
          message: `🔔 ${symbol} is now ${alert.condition} $${alert.threshold} (Current: $${currentPrice.toFixed(2)})`,
          should_notify: true,
        });

        // Mark alert as triggered
        await db.update("alerts", `id=eq.${alert.id}`, { triggered_at: new Date().toISOString() });
      }
    }
  } catch (error) {
    console.error("Error checking price alerts:", error);
  }

  return triggers;
}

/**
 * Check signal alerts
 */
export async function checkSignalAlerts(symbol: string, signal: any): Promise<AlertTrigger[]> {
  const db = getOpenJoeyDB();
  const triggers: AlertTrigger[] = [];

  try {
    // Get active signal alerts for this symbol
    const alerts = (await db.get(
      "alerts",
      `asset_symbol=eq.${symbol}&alert_type=eq.signal&is_active=eq.true`,
    )) as any[];

    for (const alert of alerts) {
      let shouldTrigger = false;
      let message = "";

      if (alert.condition === "crosses" && signal.confidence >= alert.threshold) {
        shouldTrigger = true;
        const signalEmoji = signal.signal_type === "buy" ? "🟢" : "🔴";
        message = `${signalEmoji} ${symbol} ${signal.signal_type.toUpperCase()} signal detected! Confidence: ${signal.confidence}%`;
      }

      if (shouldTrigger) {
        triggers.push({
          alert: alert as Alert,
          current_value: signal.confidence,
          message,
          should_notify: true,
        });

        await db.update("alerts", `id=eq.${alert.id}`, { triggered_at: new Date().toISOString() });
      }
    }
  } catch (error) {
    console.error("Error checking signal alerts:", error);
  }

  return triggers;
}

/**
 * Check volume alerts
 */
export async function checkVolumeAlerts(
  symbol: string,
  volumeSpike: number,
): Promise<AlertTrigger[]> {
  const db = getOpenJoeyDB();
  const triggers: AlertTrigger[] = [];

  try {
    const alerts = (await db.get(
      "alerts",
      `asset_symbol=eq.${symbol}&alert_type=eq.volume&is_active=eq.true`,
    )) as any[];

    for (const alert of alerts) {
      let shouldTrigger = false;

      if (volumeSpike > alert.threshold) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        triggers.push({
          alert: alert as Alert,
          current_value: volumeSpike,
          message: `📊 ${symbol} volume spike detected! +${volumeSpike.toFixed(1)}% above average`,
          should_notify: true,
        });

        await db.update("alerts", `id=eq.${alert.id}`, { triggered_at: new Date().toISOString() });
      }
    }
  } catch (error) {
    console.error("Error checking volume alerts:", error);
  }

  return triggers;
}

/**
 * Check whale alerts
 */
export async function checkWhaleAlerts(symbol: string, whaleEvent: any): Promise<AlertTrigger[]> {
  const db = getOpenJoeyDB();
  const triggers: AlertTrigger[] = [];

  try {
    const alerts = (await db.get(
      "alerts",
      `asset_symbol=eq.${symbol}&alert_type=eq.whale&is_active=eq.true`,
    )) as any[];

    for (const alert of alerts) {
      let shouldTrigger = false;
      let message = "";

      if (whaleEvent.amount_usd > alert.threshold) {
        shouldTrigger = true;
        const emoji = whaleEvent.event_type === "exchange_outflow" ? "🐋" : "🐳";
        message = `${emoji} Whale alert for ${symbol}! ${whaleEvent.event_type.replace("_", " ")} of $${(whaleEvent.amount_usd / 1000000).toFixed(2)}M detected`;
      }

      if (shouldTrigger) {
        triggers.push({
          alert: alert as Alert,
          current_value: whaleEvent.amount_usd,
          message,
          should_notify: true,
        });

        await db.update("alerts", `id=eq.${alert.id}`, { triggered_at: new Date().toISOString() });
      }
    }
  } catch (error) {
    console.error("Error checking whale alerts:", error);
  }

  return triggers;
}

/**
 * Deactivate an alert
 */
export async function deactivateAlert(alertId: string): Promise<boolean> {
  try {
    const db = getOpenJoeyDB();
    await db.update("alerts", `id=eq.${alertId}`, { is_active: false });
    return true;
  } catch (error) {
    console.error("Error deactivating alert:", error);
    return false;
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
  try {
    const db = getOpenJoeyDB();
    await db.delete("alerts", `id=eq.${alertId}`);
    return true;
  } catch (error) {
    console.error("Error deleting alert:", error);
    return false;
  }
}

/**
 * Auto-check all alert types
 */
export async function autoCheckAllAlerts(): Promise<AlertTrigger[]> {
  const allTriggers: AlertTrigger[] = [];

  // Get active alerts grouped by symbol
  const db = getOpenJoeyDB();
  const activeAlerts = (await db.get("alerts", "is_active=eq.true&order=asset_symbol")) as any[];

  // Group by symbol
  const alertsBySymbol: Record<string, any[]> = {};
  for (const alert of activeAlerts) {
    if (!alertsBySymbol[alert.asset_symbol]) {
      alertsBySymbol[alert.asset_symbol] = [];
    }
    alertsBySymbol[alert.asset_symbol].push(alert);
  }

  // Check each symbol
  for (const symbol of Object.keys(alertsBySymbol)) {
    // Mock current price (in production: fetch from price service)
    const currentPrice = 100 + Math.random() * 900;

    // Check price alerts
    const priceTriggers = await checkPriceAlerts(symbol, currentPrice);
    allTriggers.push(...priceTriggers);
  }

  console.log(`Checked alerts: ${allTriggers.length} triggered`);
  return allTriggers;
}
