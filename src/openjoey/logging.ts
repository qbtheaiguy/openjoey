/**
 * OpenJoey trade / AI logging. Additive only; no changes to existing log calls.
 * Use these for trade decisions, AI reasoning, token-safety. Optional file or external sinks can be added later.
 */

import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("openjoey");

/**
 * Log a trade-related decision (e.g. signal, alert, brief). Use when you want a dedicated audit trail.
 */
export function logTradeDecision(
  message: string,
  meta?: { symbol?: string; action?: string; reason?: string; [k: string]: unknown },
): void {
  log.info(`[trade] ${message}`, meta);
}

/**
 * Log AI reasoning or model output summary (e.g. for debugging or compliance). Do not log full prompts or PII.
 */
export function logAIReasoning(
  message: string,
  meta?: { model?: string; tokens?: number; [k: string]: unknown },
): void {
  log.debug(`[ai] ${message}`, meta);
}

/**
 * Log token-safety or rate-limit events (e.g. near limit, backoff).
 */
export function logTokenSafety(
  message: string,
  meta?: { provider?: string; tokens?: number; [k: string]: unknown },
): void {
  log.info(`[tokens] ${message}`, meta);
}

/** Subsystem logger for OpenJoey; use for general openjoey-scoped logs. */
export function getOpenJoeyLogger() {
  return log;
}
