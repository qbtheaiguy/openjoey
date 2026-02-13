/**
 * OpenJoey runtime config helpers. Additive only; no changes to existing config loading.
 * When openjoey.channels is set, gateway loads only those channels (e.g. telegram, discord, web, whatsapp).
 */

import type { OpenClawConfig } from "../config/config.js";

/** Only these channel ids are allowed when OpenJoey channel filter is active. All others (imessage, slack, signal, line, etc.) are rejected at core. */
export const OPENJOEY_ALLOWED_CHANNELS = ["telegram", "discord", "web", "whatsapp"] as const;

/** Only these extension ids are allowed when running as OpenJoey. All others (lobster, open-prose, etc.) are skipped during loading. */
export const OPENJOEY_ALLOWED_EXTENSIONS = [
  "telegram",
  "discord",
  "whatsapp",
  "google-antigravity-auth",
  "google-gemini-cli-auth",
  "qwen-portal-auth",
  "minimax-portal-auth",
  "memory-core",
  "memory-lancedb",
  "diagnostics-otel", // Keep observability for now
  "openjoey-guard", // Built-in guard
] as const;

/**
 * Returns the list of channel ids to load when running as OpenJoey.
 * When unset or empty, returns undefined (meaning: no filter, load all channels).
 * Env OPENJOEY_CHANNELS (comma-separated) overrides config.
 * When a allowlist is used, only ids in OPENJOEY_ALLOWED_CHANNELS are accepted; others are excluded at core.
 */
export function getOpenJoeyChannelsAllowlist(cfg: OpenClawConfig): string[] | undefined {
  const fromEnv = process.env.OPENJOEY_CHANNELS?.trim();
  if (fromEnv) {
    const list = fromEnv
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (list.length > 0) {
      return list.filter((id) =>
        OPENJOEY_ALLOWED_CHANNELS.includes(id as (typeof OPENJOEY_ALLOWED_CHANNELS)[number]),
      );
    }
  }
  const fromConfig = cfg.openjoey?.channels;
  if (Array.isArray(fromConfig) && fromConfig.length > 0) {
    const list = fromConfig.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    return list.filter((id) =>
      OPENJOEY_ALLOWED_CHANNELS.includes(id as (typeof OPENJOEY_ALLOWED_CHANNELS)[number]),
    );
  }
  return undefined;
}

/**
 * Returns true when OpenJoey channel filter is active (only certain channels will be loaded).
 */
export function isOpenJoeyChannelsFilterActive(cfg: OpenClawConfig): boolean {
  return getOpenJoeyChannelsAllowlist(cfg) != null;
}

/**
 * Returns true when outbound delivery should go through the OpenJoey delivery router.
 * Env OPENJOEY_USE_DELIVERY_ROUTER (e.g. "true") overrides config.
 */
export function isOpenJoeyDeliveryRouterEnabled(cfg: OpenClawConfig): boolean {
  const fromEnv = process.env.OPENJOEY_USE_DELIVERY_ROUTER?.trim().toLowerCase();
  if (fromEnv === "true" || fromEnv === "1") {
    return true;
  }
  if (fromEnv === "false" || fromEnv === "0") {
    return false;
  }
  return Boolean(cfg.openjoey?.useDeliveryRouter);
}

/**
 * Returns true when the OpenJoey agent bus and fixed-roster agents should be used for routing.
 * Env OPENJOEY_USE_AGENT_BUS (e.g. "true") overrides config. Default: false.
 */
export function isOpenJoeyAgentBusEnabled(cfg: OpenClawConfig): boolean {
  const fromEnv = process.env.OPENJOEY_USE_AGENT_BUS?.trim().toLowerCase();
  if (fromEnv === "true" || fromEnv === "1") {
    return true;
  }
  if (fromEnv === "false" || fromEnv === "0") {
    return false;
  }
  return Boolean(cfg.openjoey?.useAgentBus);
}
