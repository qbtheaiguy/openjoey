#!/usr/bin/env -S node --import tsx
/**
 * OpenJoey daily brief: send one morning brief per opted-in user at 8 AM.
 *
 * Usage: from repo root, with env set:
 *   SUPABASE_URL (or OPENJOEY_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (or OPENJOEY_SUPABASE_SERVICE_ROLE_KEY)
 *   TELEGRAM_BOT_TOKEN
 *
 * Example cron (8 AM UTC): 0 8 * * * cd /path/to/repo && bun run scripts/run-daily-brief.ts
 */

const BATCH_SIZE = 25;
const DELAY_MS = 100;

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? process.env.OPENJOEY_TELEGRAM_BOT_TOKEN ?? "";
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN or OPENJOEY_TELEGRAM_BOT_TOKEN required");
    process.exit(1);
  }

  const { getOpenJoeyDB } = await import("../src/openjoey/supabase-client.js");
  const { buildBriefForUser, fetchMarketSnapshot, fetchTradeNews } =
    await import("../src/openjoey/daily-brief.js");

  const db = getOpenJoeyDB();
  const users = await db.getUsersForDailyBrief();
  if (users.length === 0) {
    console.log("No users eligible for daily brief.");
    return;
  }

  const [market, news] = await Promise.all([fetchMarketSnapshot(), fetchTradeNews()]);

  let success = 0;
  let failed = 0;
  let blocked = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ telegram_id, id }) => {
        try {
          const user = await db.getUserById(id);
          if (!user) return;
          const { text, parse_mode } = await buildBriefForUser(db, user, market, news);
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegram_id,
              text,
              parse_mode,
            }),
          });
          const data = (await res.json()) as {
            ok?: boolean;
            error_code?: number;
            description?: string;
          };
          if (data.ok) {
            success += 1;
          } else {
            const msg = data.description ?? `code ${data.error_code ?? "?"}`;
            console.error(`[${telegram_id}] Telegram: ${msg}`);
            if (data.error_code === 403) blocked += 1;
            else failed += 1;
          }
        } catch (err) {
          failed += 1;
          console.error(
            `[${telegram_id}] Error:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }),
    );
    if (i + BATCH_SIZE < users.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(
    `Daily brief: sent=${success} failed=${failed} blocked=${blocked} total=${users.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
