import type { ReplyPayload } from "../types.js";

/** Regex for LINE directive blocks; used to detect and strip them when LINE channel is not present. */
const LINE_DIRECTIVE_REGEX =
  /\[\[(quick_replies|location|confirm|buttons|media_player|event|agenda|device|appletv_remote):[^\]]*\]\]/gi;

/**
 * Strip LINE-specific directive syntax from text so it does not leak to other channels.
 * LINE channel removed; no flex/template building.
 */
export function parseLineDirectives(payload: ReplyPayload): ReplyPayload {
  const text = payload.text;
  if (!text) {
    return payload;
  }
  const stripped = text
    .replace(LINE_DIRECTIVE_REGEX, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { ...payload, text: stripped || undefined };
}

/** Check if text contains any LINE directive patterns. */
export function hasLineDirectives(text: string): boolean {
  return /\[\[(quick_replies|location|confirm|buttons|media_player|event|agenda|device|appletv_remote):/i.test(
    text,
  );
}
