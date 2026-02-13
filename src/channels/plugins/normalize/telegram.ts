export function normalizeTelegramMessagingTarget(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  let normalized = trimmed;
  if (normalized.startsWith("telegram:")) {
    normalized = normalized.slice("telegram:".length).trim();
  } else if (normalized.startsWith("tg:")) {
    normalized = normalized.slice("tg:".length).trim();
  }
  if (!normalized) {
    return undefined;
  }
  const tmeMatch =
    /^https?:\/\/t\.me\/([A-Za-z0-9_]+)$/i.exec(normalized) ??
    /^t\.me\/([A-Za-z0-9_]+)$/i.exec(normalized);
  if (tmeMatch?.[1]) {
    normalized = `@${tmeMatch[1]}`;
  }
  if (!normalized) {
    return undefined;
  }
  return `telegram:${normalized}`.toLowerCase();
}

export function looksLikeTelegramTargetId(raw: string, normalized?: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  if (/^(telegram|tg|channel|group|user|conversation):/i.test(trimmed)) {
    return true;
  }
  if (normalized?.startsWith("telegram:@") || normalized?.startsWith("tg:@")) {
    return true;
  }
  if (trimmed.startsWith("@")) {
    return true;
  }
  return /^-?\d{6,}$/.test(trimmed);
}
