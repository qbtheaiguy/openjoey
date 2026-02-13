/**
 * In-memory job queue for OpenJoey internal bus.
 * Used only when openjoey.useAgentBus (or OPENJOEY_USE_AGENT_BUS) is enabled. Stub implementation.
 */

import type { BusJob } from "./types.js";

const queue: BusJob[] = [];

export function enqueueJob(job: BusJob): void {
  queue.push(job);
}

export function dequeueJob(): BusJob | undefined {
  return queue.shift();
}

export function peekNextJob(): BusJob | undefined {
  return queue[0] ?? undefined;
}

export function getQueueLength(): number {
  return queue.length;
}
