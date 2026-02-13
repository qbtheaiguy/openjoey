/**
 * OpenJoey Skill Browser - Redesigned for Better UX
 *
 * Hierarchical skill browsing:
 * 1. Main View: Category Groups (Crypto, Stocks, Options, etc.)
 * 2. Category View: Skills in that category with descriptions
 * 3. Skill Detail: Full description + Use/Fav buttons
 *
 * Scalable: adding a skill = add to skill_catalog + skills/ folder.
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
  subCategory: string;
  description: string;
  fullDescription: string;
}

interface CatalogRow {
  id: string;
  display_name: string;
  description?: string | null;
  full_description?: string | null;
  category: string | null;
  sub_category?: string | null;
  is_active: boolean;
}

// Category display config — emoji + label per category key
const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; description: string }> = {
  trading: { emoji: "📊", label: "Trading", description: "Technical analysis and signals" },
  crypto: { emoji: "🪙", label: "Crypto", description: "Bitcoin, Ethereum, altcoins" },
  research: { emoji: "🔬", label: "Research", description: "Deep dives and intelligence" },
  alerts: { emoji: "🔔", label: "Alerts", description: "Notifications and tracking" },
  options: { emoji: "📈", label: "Options", description: "Options chains and strategies" },
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
      subCategory: r.sub_category ?? r.category ?? "other",
      description: r.description?.trim() ?? "Trading analysis skill",
      fullDescription:
        r.full_description?.trim() ??
        r.description?.trim() ??
        "Use this skill for market analysis and trading signals.",
    }));
  } catch {
    // Fallback: derive from SKILL_METADATA
    return Object.entries(SKILL_METADATA).map(([id, meta]) => ({
      id,
      displayName: meta.displayName,
      category: "trading",
      subCategory: "trading",
      description: "Trading analysis skill",
      fullDescription: "Use this skill for market analysis and trading signals.",
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
 * Build the /skills overview: Shows categories with counts and descriptions
 * Each category button drills down to see skills in that category.
 */
export async function buildSkillsOverview(userFavorites: string[]): Promise<SkillBrowseResult> {
  const skills = await loadSkills();
  const favSet = new Set(userFavorites);
  const favCount = userFavorites.filter((id) => skills.some((s) => s.id === id)).length;

  // Group by category
  const grouped = new Map<string, SkillEntry[]>();
  for (const skill of skills) {
    const cat = skill.category;
    if (!grouped.has(cat)) {
      grouped.set(cat, []);
    }
    grouped.get(cat)!.push(skill);
  }

  // Priority order for categories
  const priority = ["crypto", "stocks", "trading", "options", "research", "alerts"];
  const sortedCats = Array.from(grouped.keys()).sort((a, b) => {
    const aIdx = priority.indexOf(a);
    const bIdx = priority.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  let text = "📚 *Trading Skills Library*\n\n";
  text += "Choose a category to explore:\n\n";

  const keyboard: KeyboardButton[][] = [];

  for (const cat of sortedCats) {
    const entries = grouped.get(cat)!;
    const config = CATEGORY_CONFIG[cat] ?? DEFAULT_CATEGORY;

    // Count favorites in this category
    const catFavs = entries.filter((e) => favSet.has(e.id)).length;
    const favIndicator = catFavs > 0 ? ` ⭐${catFavs}` : "";

    text += `${config.emoji} *${config.label}* — ${entries.length} skills${favIndicator}\n`;
    text += `└ ${config.description}\n\n`;

    keyboard.push([
      {
        text: `${config.emoji} ${config.label} (${entries.length})`,
        callback_data: `s:cat:${cat}`,
      },
    ]);
  }

  if (favCount > 0) {
    text += `You have ${favCount} ⭐ favorite skill${favCount === 1 ? "" : "s"}\n`;
  }
  text += "\nTap a category to see skills 👆";

  keyboard.push([
    { text: "⭐ My Favorites", callback_data: "s:favorites" },
    { text: "🏠 Main Menu", callback_data: "m:main" },
  ]);

  return { text, keyboard };
}

/**
 * Build a category drill-down: Shows skills in the category with descriptions
 * Each skill has: Name, Description, [Use] button, [Fav] button
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
      keyboard: [[{ text: "🔙 Back to Skills", callback_data: "m:skills" }]],
    };
  }

  // Group by sub-category
  const bySubCat = new Map<string, SkillEntry[]>();
  for (const skill of filtered) {
    const sub = skill.subCategory;
    if (!bySubCat.has(sub)) {
      bySubCat.set(sub, []);
    }
    bySubCat.get(sub)!.push(skill);
  }

  let text = `${config.emoji} *${config.label} Skills*\n\n`;
  text += `${config.description}\n\n`;

  const keyboard: KeyboardButton[][] = [];

  // Sort sub-categories
  const sortedSubCats = Array.from(bySubCat.keys()).sort();

  for (const subCat of sortedSubCats) {
    const subSkills = bySubCat.get(subCat)!;

    for (const skill of subSkills) {
      const isFav = favSet.has(skill.id);

      // Add skill name and description to text
      text += `*${skill.displayName}*${isFav ? " ⭐" : ""}\n`;
      text += `${skill.description}\n\n`;

      // Each skill gets its own row with action buttons
      keyboard.push([
        { text: `🚀 ${skill.displayName}`, callback_data: `s:use:${skill.id}` },
        {
          text: isFav ? "❌ Unfav" : "⭐ Fav",
          callback_data: isFav
            ? `s:unfav:${skill.id}:${category}`
            : `s:fav:${skill.id}:${category}`,
        },
        { text: "ℹ️ Info", callback_data: `s:detail:${skill.id}:${category}` },
      ]);
    }
  }

  keyboard.push([
    { text: "🔙 All Categories", callback_data: "m:skills" },
    { text: "🏠 Main", callback_data: "m:main" },
  ]);

  return { text, keyboard };
}

/**
 * Build individual skill detail view: Shows full description with what the skill does
 * [Use Skill] [Add to Favorites] [Back to Category]
 */
export async function buildSkillDetailView(
  skillId: string,
  categoryForBack: string,
  userFavorites: string[],
): Promise<SkillBrowseResult> {
  const db = getOpenJoeyDB();
  const skills = await loadSkills();
  const skill = skills.find((s) => s.id === skillId);
  const config = CATEGORY_CONFIG[categoryForBack] ?? DEFAULT_CATEGORY;
  const isFav = userFavorites.includes(skillId);

  // Try to get fresh data from DB (may fail gracefully)
  let displayName = skill?.displayName ?? skillId;
  let fullDesc = skill?.fullDescription ?? skill?.description ?? "Trading analysis skill";

  try {
    const meta = await db.getSkillForDetail(skillId);
    if (meta) {
      displayName = meta.display_name;
      // Use full_description if available, fall back to description
      fullDesc = meta.full_description ?? meta.description ?? fullDesc;
    }
  } catch {
    // Use cached data from loadSkills
  }

  let text = `*${displayName}*\n`;
  text += `━━━━━━━━━━━━━━━\n\n`;
  text += `${fullDesc}\n\n`;

  if (isFav) {
    text += "⭐ This skill is in your favorites\n";
  }

  const keyboard: KeyboardButton[][] = [
    [{ text: "🚀 USE THIS SKILL", callback_data: `s:use:${skillId}` }],
    [
      {
        text: isFav ? "❌ Remove from Favorites" : "⭐ Add to Favorites",
        callback_data: isFav
          ? `s:unfav:${skillId}:detail:${categoryForBack}`
          : `s:fav:${skillId}:detail:${categoryForBack}`,
      },
    ],
    [
      { text: `🔙 Back to ${config.label}`, callback_data: `s:cat:${categoryForBack}` },
      { text: "🏠 Main Menu", callback_data: "m:main" },
    ],
  ];

  return { text, keyboard };
}
