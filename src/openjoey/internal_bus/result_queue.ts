/**
 * Result queue for OpenJoey internal bus (in-memory stub).
 * Stores results by job id for pickup by coordinator or callers.
 */

import type { BusJobResult } from "./types.js";

const resultsByJobId = new Map<string, BusJobResult>();

export function pushResult(result: BusJobResult): void {
  resultsByJobId.set(result.jobId, result);
}

export function getResult(jobId: string): BusJobResult | undefined {
  return resultsByJobId.get(jobId);
}

export function clearResult(jobId: string): void {
  resultsByJobId.delete(jobId);
}
