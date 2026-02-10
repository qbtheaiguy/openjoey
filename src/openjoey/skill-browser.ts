/**
 * OpenJoey Skill Browser
 *
 * Builds category-based skill browsing for /skills command and
 * the s:cat: callback drill-down. Reads skill_catalog from Supabase
 * for categories and display names, falls back to SKILL_METADATA.
 *
 * Scalable: adding a skill = add to skill_catalog + skills/ folder.
 * This module reads from the catalog automatically.
 */

import type { KeyboardButton } from "./keyboard-builder.js";
import { SKILL_METADATA } from "./skill-guard.js";
import { getOpenJoeyDB } from "./supabase-client.js";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SkillEntry {
  id: string;
  displayName: string;
  category: string;
}

interface CatalogRow {
  id: string;
  display_name: string;
  description?: string | null;
  category: string | null;
  is_active: boolean;
}

// Category display config — emoji + label per category key
const CATEGORY_CONFIG: Record<string, { emoji: string; label: string }> = {
  trading: { emoji: "\u{1F4CA}", label: "Trading" },
  research: { emoji: "\u{1F50D}", label: "Research" },
  alerts: { emoji: "\u{1F514}", label: "Alerts & Tracking" },
  crypto: { emoji: "\u{1FA99}", label: "Crypto" },
  options: { emoji: "\u{1F4C8}", label: "Options" },
};

const DEFAULT_CATEGORY = { emoji: "\u{1F9E0}", label: "Other" };

/** Category label for breadcrumbs (§9.2). */
export function getCategoryLabel(category: string): string {
  return CATEGORY_CONFIG[category]?.label ?? DEFAULT_CATEGORY.label;
}

// ──────────────────────────────────────────────
// Load skills from catalog (with fallback)
// ──────────────────────────────────────────────

async function loadSkills(): Promise<SkillEntry[]> {
  const db = getOpenJoeyDB();
  try {
    const rows = await db.get<CatalogRow>("skill_catalog", "is_active=eq.true&order=category,id");
    return rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      category: r.category ?? "other",
    }));
  } catch {
    // Fallback: derive from SKILL_METADATA
    return Object.entries(SKILL_METADATA).map(([id, meta]) => ({
      id,
      displayName: meta.displayName,
      category: "trading", // no category in metadata; default
    }));
  }
}

// ──────────────────────────────────────────────
// Build /skills overview
// ──────────────────────────────────────────────

export interface SkillBrowseResult {
  text: string;
  keyboard: KeyboardButton[][];
}

/**
 * Build the /skills overview: grouped by category, each category
 * is a button that drills down (s:cat:<category>).
 */
export async function buildSkillsOverview(userFavorites: string[]): Promise<SkillBrowseResult> {
  const skills = await loadSkills();
  const favSet = new Set(userFavorites);

  // Group by category
  const grouped = new Map<string, SkillEntry[]>();
  for (const skill of skills) {
    const cat = skill.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(skill);
  }

  let text = "\u{1F4DA} *All Skills*\nTap to use, \u2B50 to favorite.\n";

  const keyboard: KeyboardButton[][] = [];

  for (const [cat, entries] of grouped) {
    const config = CATEGORY_CONFIG[cat] ?? DEFAULT_CATEGORY;
    const names = entries.map((e) => {
      const star = favSet.has(e.id) ? " \u2B50" : "";
      return `${e.displayName}${star}`;
    });
    text += `\n${config.emoji} *${config.label}* (${entries.length})\n`;
    text += names.join(", ") + "\n";

    keyboard.push([
      {
        text: `${config.emoji} ${config.label} (${entries.length})`,
        callback_data: `s:cat:${cat}`,
      },
    ]);
  }

  text += `\n\u2B50 = Your favorites | Tap skill \u2192 use | Tap \u2B50 \u2192 toggle`;

  keyboard.push([
    { text: "\u2B50 My Favorites", callback_data: "s:favorites" },
    { text: "\u{1F519} Back", callback_data: "m:main" },
  ]);

  return { text, keyboard };
}

/**
 * Build a category drill-down: list skills in one category with
 * [Use] and [Fav/Unfav] per skill.
 */
export async function buildCategoryView(
  category: string,
  userFavorites: string[],
): Promise<SkillBrowseResult> {
  const skills = await loadSkills();
  const favSet = new Set(userFavorites);
  const filtered = skills.filter((s) => s.category === category);
  const config = CATEGORY_CONFIG[category] ?? DEFAULT_CATEGORY;

  if (filtered.length === 0) {
    return {
      text: `${config.emoji} *${config.label}*\n\nNo skills in this category yet.`,
      keyboard: [[{ text: "\u{1F519} Back to Skills", callback_data: "m:skills" }]],
    };
  }

  let text = `${config.emoji} *${config.label}*\n\n`;
  const keyboard: KeyboardButton[][] = [];

  for (const skill of filtered) {
    const isFav = favSet.has(skill.id);
    const star = isFav ? " \u2B50" : "";
    text += `\u2022 ${skill.displayName}${star}\n`;

    keyboard.push([
      { text: `\u{1F680} ${skill.displayName}`, callback_data: `s:use:${skill.id}` },
      {
        text: isFav ? "\u{1F5D1} Unfav" : "\u2B50 Fav",
        callback_data: isFav ? `s:unfav:${skill.id}` : `s:fav:${skill.id}`,
      },
      { text: "\u2139\uFE0F Detail", callback_data: `s:detail:${skill.id}:${category}` },
    ]);
  }

  keyboard.push([
    { text: "\u{1F519} All Skills", callback_data: "m:skills" },
    { text: "\u{1F3E0} Main", callback_data: "m:main" },
  ]);

  return { text, keyboard };
}

/**
 * Build individual skill detail view (§3.4): name, description, [Use] [Fav/Unfav] [Back].
 * categoryForBack is used for the Back button (s:cat:category).
 */
export async function buildSkillDetailView(
  skillId: string,
  categoryForBack: string,
  userFavorites: string[],
): Promise<SkillBrowseResult> {
  const db = getOpenJoeyDB();
  const meta = await db.getSkillForDetail(skillId);
  const config = CATEGORY_CONFIG[categoryForBack] ?? DEFAULT_CATEGORY;
  const isFav = userFavorites.includes(skillId);

  const displayName = meta?.display_name ?? skillId;
  const description = meta?.description?.trim() ?? "Use this skill for analysis and signals.";

  let text = `\u{1F9E0} *${displayName}*\n\n`;
  text += `${description}\n\n`;
  if (isFav) text += "\u2B50 In favorites\n";

  const keyboard: KeyboardButton[][] = [
    [
      { text: "\u{1F680} Use", callback_data: `s:use:${skillId}` },
      {
        text: isFav ? "\u{1F5D1} Unfavorite" : "\u2B50 Favorite",
        callback_data: isFav
          ? `s:unfav:${skillId}:detail:${categoryForBack}`
          : `s:fav:${skillId}:detail:${categoryForBack}`,
      },
    ],
    [{ text: "\u2699\uFE0F Settings", callback_data: `s:settings:${skillId}` }],
    [
      { text: `\u{1F519} Back to ${config.label}`, callback_data: `s:cat:${categoryForBack}` },
      { text: "\u{1F3E0} Main", callback_data: "m:main" },
    ],
  ];

  return { text, keyboard };
}
