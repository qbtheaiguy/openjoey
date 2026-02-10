#!/usr/bin/env npx ts-node
/**
 * OpenJoey Trading Skills Validator
 *
 * Validates all premium trading skills for ClawHub-compatible format.
 * Checks frontmatter, structure, required sections, and tier configuration.
 *
 * Usage: npx ts-node scripts/validate-trading-skills.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as yaml from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION: Your 18+ Premium Trading Skills
// ═══════════════════════════════════════════════════════════════════════════

interface SkillConfig {
  name: string;
  tier: "core" | "trial" | "subscriber" | "premium" | "legacy";
  description: string;
  expectedEmoji?: string;
  isRequired: boolean;
}

const TRADING_SKILLS: SkillConfig[] = [
  // Core Skills (available to all tiers)
  {
    name: "signal-guru",
    tier: "core",
    description: "Master multi-asset analyzer",
    expectedEmoji: "🧠",
    isRequired: true,
  },
  {
    name: "research-guru",
    tier: "core",
    description: "Deep research system",
    expectedEmoji: "🔬",
    isRequired: true,
  },
  {
    name: "crypto-guru",
    tier: "core",
    description: "Crypto-specific deep dives",
    expectedEmoji: "🔮",
    isRequired: true,
  },
  {
    name: "meme-guru",
    tier: "core",
    description: "Meme coin degen intelligence",
    expectedEmoji: "🐸",
    isRequired: true,
  },
  {
    name: "edy",
    tier: "core",
    description: "Personalized skill for Edy 💕",
    expectedEmoji: "💕",
    isRequired: true,
  },

  // Multi-Asset Skills (trial and up)
  {
    name: "stock-guru",
    tier: "trial",
    description: "Stocks & ETFs",
    expectedEmoji: "📈",
    isRequired: true,
  },
  {
    name: "forex-guru",
    tier: "trial",
    description: "Currency pairs",
    expectedEmoji: "💱",
    isRequired: true,
  },
  {
    name: "commodity-guru",
    tier: "trial",
    description: "Gold, oil, etc.",
    expectedEmoji: "⚡",
    isRequired: true,
  },

  // Subscriber Skills (trader, annual, premium)
  {
    name: "whale-guru",
    tier: "subscriber",
    description: "Whale tracking & smart money",
    expectedEmoji: "🐋",
    isRequired: true,
  },
  {
    name: "alert-guru",
    tier: "subscriber",
    description: "Price alerts (background)",
    expectedEmoji: "🔔",
    isRequired: true,
  },
  // Premium Skills
  {
    name: "options-guru",
    tier: "premium",
    description: "Options chain analysis",
    expectedEmoji: "🎲",
    isRequired: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RULES (ClawHub-Compatible Format)
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationResult {
  skill: string;
  exists: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  score: number; // 0-100
  frontmatter: Record<string, any> | null;
}

interface FrontmatterCheck {
  field: string;
  required: boolean;
  validator?: (value: any) => boolean;
  message?: string;
}

const FRONTMATTER_CHECKS: FrontmatterCheck[] = [
  { field: "name", required: true, validator: (v) => typeof v === "string" && v.length > 0 },
  {
    field: "description",
    required: true,
    validator: (v) => typeof v === "string" && v.length > 20,
  },
  { field: "metadata", required: false },
  {
    field: "metadata.openclaw.emoji",
    required: false,
    validator: (v) => typeof v === "string" && v.length > 0,
  },
  { field: "metadata.openclaw.requires.bins", required: false, validator: (v) => Array.isArray(v) },
  { field: "metadata.openclaw.requires.env", required: false, validator: (v) => Array.isArray(v) },
];

const REQUIRED_SECTIONS = ["## Overview", "## When to Activate"];

const RECOMMENDED_SECTIONS = ["## Data Sources", "## Output Format", "## Follow-Up Suggestions"];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function parseFrontmatter(content: string): {
  frontmatter: Record<string, any> | null;
  body: string;
} {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (!normalized.startsWith("---")) {
    return { frontmatter: null, body: content };
  }

  const endIndex = normalized.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }

  const yamlBlock = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 4);

  try {
    const parsed = yaml.parse(yamlBlock);
    return { frontmatter: parsed, body };
  } catch (e) {
    return { frontmatter: null, body: content };
  }
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

function validateSkill(skillPath: string, config: SkillConfig): ValidationResult {
  const result: ValidationResult = {
    skill: config.name,
    exists: false,
    errors: [],
    warnings: [],
    info: [],
    score: 0,
    frontmatter: null,
  };

  // Check if skill folder exists
  if (!fs.existsSync(skillPath)) {
    result.errors.push(`Skill folder not found: ${skillPath}`);
    return result;
  }

  // Check if SKILL.md exists
  const skillMdPath = path.join(skillPath, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) {
    result.errors.push(`SKILL.md not found in ${skillPath}`);
    return result;
  }

  result.exists = true;

  // Read and parse SKILL.md
  const content = fs.readFileSync(skillMdPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);
  result.frontmatter = frontmatter;

  let score = 0;
  const maxScore = 100;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. FRONTMATTER VALIDATION (40 points)
  // ─────────────────────────────────────────────────────────────────────────

  if (!frontmatter) {
    result.errors.push("Missing YAML frontmatter (must start with --- and end with ---)");
  } else {
    score += 10; // Has frontmatter
    result.info.push("✓ Has YAML frontmatter");

    // Check required fields
    for (const check of FRONTMATTER_CHECKS) {
      const value = getNestedValue(frontmatter, check.field);

      if (check.required && (value === undefined || value === null)) {
        result.errors.push(`Missing required field: ${check.field}`);
      } else if (value !== undefined && check.validator && !check.validator(value)) {
        result.warnings.push(`Invalid value for ${check.field}`);
      } else if (value !== undefined) {
        score += 5;
      }
    }

    // Check name matches folder
    if (frontmatter.name && frontmatter.name !== config.name) {
      result.warnings.push(
        `Frontmatter name "${frontmatter.name}" doesn't match expected "${config.name}"`,
      );
    } else if (frontmatter.name) {
      score += 5;
      result.info.push(`✓ Name matches: ${frontmatter.name}`);
    }

    // Check emoji if expected
    const emoji = getNestedValue(frontmatter, "metadata.openclaw.emoji");
    if (config.expectedEmoji) {
      if (emoji === config.expectedEmoji) {
        score += 5;
        result.info.push(`✓ Emoji: ${emoji}`);
      } else if (emoji) {
        result.warnings.push(`Emoji "${emoji}" differs from expected "${config.expectedEmoji}"`);
      } else {
        result.warnings.push(`Missing emoji, expected: ${config.expectedEmoji}`);
      }
    } else if (emoji) {
      score += 5;
      result.info.push(`✓ Has emoji: ${emoji}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. REQUIRED SECTIONS (30 points)
  // ─────────────────────────────────────────────────────────────────────────

  for (const section of REQUIRED_SECTIONS) {
    if (body.includes(section)) {
      score += 10;
      result.info.push(`✓ Has ${section}`);
    } else {
      result.errors.push(`Missing required section: ${section}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. RECOMMENDED SECTIONS (20 points)
  // ─────────────────────────────────────────────────────────────────────────

  for (const section of RECOMMENDED_SECTIONS) {
    if (body.includes(section)) {
      score += 6;
      result.info.push(`✓ Has ${section}`);
    } else {
      result.warnings.push(`Missing recommended section: ${section}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CONTENT QUALITY (10 points)
  // ─────────────────────────────────────────────────────────────────────────

  // Check for disclaimer
  if (
    body.toLowerCase().includes("disclaimer") ||
    body.toLowerCase().includes("not financial advice")
  ) {
    score += 5;
    result.info.push("✓ Has disclaimer");
  } else {
    result.warnings.push("Missing disclaimer/NFA notice");
  }

  // Check content length
  const wordCount = body.split(/\s+/).length;
  if (wordCount > 500) {
    score += 5;
    result.info.push(`✓ Good content length: ~${wordCount} words`);
  } else if (wordCount > 200) {
    score += 2;
    result.warnings.push(`Content might be too short: ~${wordCount} words`);
  } else {
    result.errors.push(`Content very short: ~${wordCount} words`);
  }

  // Normalize score
  result.score = Math.min(100, Math.round((score / maxScore) * 100));

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER CONFIGURATION CHECK
// ═══════════════════════════════════════════════════════════════════════════

interface TierCheckResult {
  skill: string;
  inSessionIsolation: boolean;
  correctTier: boolean;
  configuredTier?: string;
  expectedTier: string;
}

function checkSessionIsolation(skillsDir: string): TierCheckResult[] {
  const sessionIsolationPath = path.join(
    skillsDir,
    "..",
    "src",
    "openjoey",
    "session-isolation.ts",
  );

  if (!fs.existsSync(sessionIsolationPath)) {
    console.log("⚠️  Could not find session-isolation.ts for tier check");
    return [];
  }

  const content = fs.readFileSync(sessionIsolationPath, "utf-8");
  const results: TierCheckResult[] = [];

  // Extract skill arrays from the file
  const coreMatch = content.match(/CORE_SKILLS\s*=\s*\[([\s\S]*?)\]/);
  const multiAssetMatch = content.match(/TRADING_SKILLS\s*=\s*\[([\s\S]*?)\]/);
  const subscriberMatch = content.match(/SUBSCRIBER_SKILLS\s*=\s*\[([\s\S]*?)\]/);
  const premiumMatch = content.match(/PREMIUM_SKILLS\s*=\s*\[([\s\S]*?)\]/);

  const extractSkills = (match: RegExpMatchArray | null): string[] => {
    if (!match) return [];
    const skills = match[1].match(/"([^"]+)"/g) || [];
    return skills.map((s) => s.replace(/"/g, ""));
  };

  const coreSkills = extractSkills(coreMatch);
  const multiAssetSkills = extractSkills(multiAssetMatch);
  const subscriberSkills = extractSkills(subscriberMatch);
  const premiumSkills = extractSkills(premiumMatch);

  for (const config of TRADING_SKILLS) {
    let configuredTier: string | undefined;

    if (coreSkills.includes(config.name)) {
      configuredTier = "core";
    } else if (multiAssetSkills.includes(config.name)) {
      configuredTier = "trial";
    } else if (subscriberSkills.includes(config.name)) {
      configuredTier = "subscriber";
    } else if (premiumSkills.includes(config.name)) {
      configuredTier = "premium";
    }

    results.push({
      skill: config.name,
      inSessionIsolation: configuredTier !== undefined,
      correctTier: configuredTier === config.tier || config.tier === "legacy",
      configuredTier,
      expectedTier: config.tier,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  const skillsDir = path.resolve(__dirname, "..", "skills");

  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("   🎯 OpenJoey Premium Trading Skills Validator");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`\n📂 Scanning: ${skillsDir}\n`);

  const results: ValidationResult[] = [];

  // Group skills by tier
  const tiers = ["core", "trial", "subscriber", "premium", "legacy"] as const;
  const skillsByTier = new Map<string, SkillConfig[]>();

  for (const tier of tiers) {
    skillsByTier.set(
      tier,
      TRADING_SKILLS.filter((s) => s.tier === tier),
    );
  }

  // Validate each tier
  for (const tier of tiers) {
    const skills = skillsByTier.get(tier) || [];
    if (skills.length === 0) continue;

    const tierLabels: Record<string, string> = {
      core: "🟢 CORE SKILLS (Free/All Tiers)",
      trial: "🟡 TRIAL+ SKILLS (Multi-Asset)",
      subscriber: "🟠 SUBSCRIBER SKILLS (Trader/Annual)",
      premium: "🔴 PREMIUM SKILLS",
      legacy: "⚪ LEGACY SKILLS (Backward Compat)",
    };

    console.log("\n" + tierLabels[tier]);
    console.log("─".repeat(50));

    for (const config of skills) {
      const skillPath = path.join(skillsDir, config.name);
      const result = validateSkill(skillPath, config);
      results.push(result);

      const scoreEmoji =
        result.score >= 90 ? "✅" : result.score >= 70 ? "🟡" : result.score >= 50 ? "🟠" : "❌";

      console.log(`\n${scoreEmoji} ${config.name} — Score: ${result.score}/100`);
      console.log(`   ${config.description}`);

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          console.log(`   ❌ ${error}`);
        }
      }

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          console.log(`   ⚠️  ${warning}`);
        }
      }

      // Show key frontmatter
      if (result.frontmatter) {
        const emoji =
          result.frontmatter.metadata?.openclaw?.emoji ||
          result.frontmatter.metadata?.clawdbot?.emoji ||
          "—";
        const name = result.frontmatter.name || "—";
        console.log(`   📋 Frontmatter: name="${name}", emoji=${emoji}`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TIER CONFIGURATION CHECK
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n\n═══════════════════════════════════════════════════════════════════");
  console.log("   📊 Session Isolation Tier Check");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const tierResults = checkSessionIsolation(skillsDir);

  if (tierResults.length > 0) {
    let missingCount = 0;
    let mismatchCount = 0;

    for (const r of tierResults) {
      if (!r.inSessionIsolation && r.expectedTier !== "legacy") {
        console.log(`❌ ${r.skill}: NOT in session-isolation.ts (expected: ${r.expectedTier})`);
        missingCount++;
      } else if (!r.correctTier && r.expectedTier !== "legacy") {
        console.log(
          `⚠️  ${r.skill}: Tier mismatch (configured: ${r.configuredTier}, expected: ${r.expectedTier})`,
        );
        mismatchCount++;
      } else {
        console.log(`✅ ${r.skill}: ${r.configuredTier || "legacy (OK)"}`);
      }
    }

    if (missingCount > 0 || mismatchCount > 0) {
      console.log(
        `\n⚠️  Found ${missingCount} missing and ${mismatchCount} mismatched tier configurations`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n\n═══════════════════════════════════════════════════════════════════");
  console.log("   📊 VALIDATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const existing = results.filter((r) => r.exists);
  const missing = results.filter((r) => !r.exists);
  const excellent = results.filter((r) => r.score >= 90);
  const good = results.filter((r) => r.score >= 70 && r.score < 90);
  const needsWork = results.filter((r) => r.score >= 50 && r.score < 70);
  const critical = results.filter((r) => r.exists && r.score < 50);

  console.log(`📦 Total Trading Skills: ${TRADING_SKILLS.length}`);
  console.log(`✅ Existing: ${existing.length}`);
  console.log(`❌ Missing: ${missing.length}`);
  console.log("");
  console.log(`🟢 Excellent (90+): ${excellent.length}`);
  console.log(`🟡 Good (70-89): ${good.length}`);
  console.log(`🟠 Needs Work (50-69): ${needsWork.length}`);
  console.log(`🔴 Critical (<50): ${critical.length}`);

  // Average score
  const avgScore =
    existing.length > 0
      ? Math.round(existing.reduce((sum, r) => sum + r.score, 0) / existing.length)
      : 0;
  console.log(`\n📊 Average Score: ${avgScore}/100`);

  // Missing skills
  if (missing.length > 0) {
    console.log("\n❌ Missing Skills:");
    for (const r of missing) {
      const config = TRADING_SKILLS.find((s) => s.name === r.skill);
      if (config?.isRequired) {
        console.log(`   • ${r.skill} (REQUIRED)`);
      }
    }
  }

  // Critical issues
  if (critical.length > 0) {
    console.log("\n🔴 Critical Issues (needs immediate attention):");
    for (const r of critical) {
      console.log(`   • ${r.skill}: Score ${r.score}/100`);
      for (const error of r.errors.slice(0, 3)) {
        console.log(`     └─ ${error}`);
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════════\n");

  // Exit code based on critical issues
  if (
    critical.length > 0 ||
    missing.filter((r) => TRADING_SKILLS.find((s) => s.name === r.skill)?.isRequired).length > 0
  ) {
    process.exit(1);
  }
}

main();
