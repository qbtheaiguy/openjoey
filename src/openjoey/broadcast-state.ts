/**
 * In-memory state for /announce flow: admin sends /announce, then the next message
 * is the broadcast text; we show preview + [Yes, Send] [Cancel]; on confirm we run broadcast.
 */

type Pending = { step: "waiting" } | { step: "preview"; text: string };

const pendingByTelegramId = new Map<number, Pending>();

export function getPendingAnnounce(telegramId: number): Pending | undefined {
  return pendingByTelegramId.get(telegramId);
}

export function setPendingWaiting(telegramId: number): void {
  pendingByTelegramId.set(telegramId, { step: "waiting" });
}

export function setPendingPreview(telegramId: number, text: string): void {
  pendingByTelegramId.set(telegramId, { step: "preview", text });
}

export function clearPending(telegramId: number): void {
  pendingByTelegramId.delete(telegramId);
}

/** Returns the pending text and clears state; use when user confirms send. */
export function consumePendingForSend(telegramId: number): string | null {
  const p = pendingByTelegramId.get(telegramId);
  pendingByTelegramId.delete(telegramId);
  return p?.step === "preview" ? p.text : null;
}
