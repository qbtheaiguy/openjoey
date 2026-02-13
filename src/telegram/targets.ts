export type TelegramTarget = {
  chatId: string;
  messageThreadId?: number;
};

export function stripTelegramInternalPrefixes(to: string): string {
  let trimmed = to.trim();
  let strippedTelegramPrefix = false;
  while (true) {
    const next = (() => {
      if (/^(telegram|tg):/i.test(trimmed)) {
        strippedTelegramPrefix = true;
        return trimmed.replace(/^(telegram|tg):/i, "").trim();
      }
      // Legacy internal form: `telegram:group:<id>` (still emitted by session keys).
      if (strippedTelegramPrefix && /^(group|channel):/i.test(trimmed)) {
        return trimmed.replace(/^(group|channel):/i, "").trim();
      }
      return trimmed;
    })();
    if (next === trimmed) {
      return trimmed;
    }
    trimmed = next;
  }
}

/**
 * Parse a Telegram delivery target into chatId and optional topic/thread ID.
 *
 * Supported formats:
 * - `chatId` (plain chat ID, t.me link, @username, or internal prefixes like `telegram:...`)
 * - `chatId:topicId` (numeric topic/thread ID)
 * - `chatId:topic:topicId` (explicit topic marker; preferred)
 */
export function parseTelegramTarget(to: string): TelegramTarget {
  const normalized = stripTelegramInternalPrefixes(to);

  const topicMatch = /^(.+?):topic:(\d+)$/.exec(normalized);
  if (topicMatch) {
    return {
      chatId: topicMatch[1],
      messageThreadId: Number.parseInt(topicMatch[2], 10),
    };
  }

  const colonMatch = /^(.+):(\d+)$/.exec(normalized);
  if (colonMatch) {
    return {
      chatId: colonMatch[1],
      messageThreadId: Number.parseInt(colonMatch[2], 10),
    };
  }

  return { chatId: normalized };
}

/** Normalizes a Telegram target string for canonical storage/lookup. */
export function normalizeTelegramTarget(to: string): string | undefined {
  const parsed = parseTelegramTarget(to);
  let chatId = parsed.chatId.trim();
  if (!chatId) {
    return undefined;
  }
  // Usernames are case-insensitive.
  if (chatId.startsWith("@")) {
    chatId = chatId.toLowerCase();
  }
  if (parsed.messageThreadId != null) {
    return `${chatId}:topic:${parsed.messageThreadId}`;
  }
  return chatId;
}
