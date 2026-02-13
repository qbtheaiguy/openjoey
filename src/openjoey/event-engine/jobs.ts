/**
 * OpenJoey Event Engine — job definitions only.
 * These are templates for pre-market, whale snapshots, hourly scans, etc.
 * They are not auto-registered; use scripts or gateway hooks to add them to the cron store
 * when OPENJOEY_EVENT_ENGINE (or openjoey.eventEngine) is enabled.
 */

import type { CronJobCreate } from "../../cron/types.js";

/** One day in ms. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
/** One hour in ms. */
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Pre-market brief: run once per day before market open (e.g. 09:00 UTC).
 * Template; anchorMs should be set by caller to desired run time.
 */
export function preMarketBriefJobTemplate(anchorMs?: number): Partial<CronJobCreate> {
  return {
    name: "openjoey-pre-market",
    description: "Pre-market brief (OpenJoey)",
    enabled: false,
    schedule: { kind: "every", everyMs: ONE_DAY_MS, anchorMs },
    sessionTarget: "main",
    wakeMode: "next-heartbeat",
    payload: {
      kind: "systemEvent",
      text: "Run pre-market brief: summarize overnight news, key levels, and session plan.",
    },
  };
}

/**
 * Whale snapshot: run periodically (e.g. every 6 hours) to snapshot whale activity.
 * Template; use isolated session and agentTurn if delivery is needed.
 */
export function whaleSnapshotJobTemplate(anchorMs?: number): Partial<CronJobCreate> {
  return {
    name: "openjoey-whale-snapshot",
    description: "Whale activity snapshot (OpenJoey)",
    enabled: false,
    schedule: { kind: "every", everyMs: 6 * ONE_HOUR_MS, anchorMs },
    sessionTarget: "main",
    wakeMode: "next-heartbeat",
    payload: {
      kind: "systemEvent",
      text: "Run whale snapshot: summarize large moves and notable wallet flows.",
    },
  };
}

/**
 * Hourly scan: run every hour for short market/alert check.
 */
export function hourlyScanJobTemplate(anchorMs?: number): Partial<CronJobCreate> {
  return {
    name: "openjoey-hourly-scan",
    description: "Hourly market scan (OpenJoey)",
    enabled: false,
    schedule: { kind: "every", everyMs: ONE_HOUR_MS, anchorMs },
    sessionTarget: "main",
    wakeMode: "next-heartbeat",
    payload: {
      kind: "systemEvent",
      text: "Run hourly scan: check alerts and key levels.",
    },
  };
}

/** All OpenJoey event-engine job templates (pre-market, whale snapshot, hourly scan). */
export function getOpenJoeyEventJobTemplates(nowMs: number): Partial<CronJobCreate>[] {
  return [
    preMarketBriefJobTemplate(nowMs),
    whaleSnapshotJobTemplate(nowMs),
    hourlyScanJobTemplate(nowMs),
  ];
}
