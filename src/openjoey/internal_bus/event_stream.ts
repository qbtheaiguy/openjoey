/**
 * Event stream for OpenJoey internal bus (in-memory stub).
 * Publish/subscribe; no persistence. Used only when agent bus is enabled.
 */

import type { BusEvent, BusEventSubscription } from "./types.js";

const subscribers = new Set<BusEventSubscription>();

export function publish(event: BusEvent): void {
  for (const sub of subscribers) {
    try {
      sub(event);
    } catch {
      // ignore subscriber errors
    }
  }
}

export function subscribe(callback: BusEventSubscription): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}
