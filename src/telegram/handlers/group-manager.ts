/**
 * Telegram Group Manager
 * Handles group migration and configuration
 * Target: < 300 lines
 */

import type { Context } from "grammy";
import type { OpenClawConfig } from "../../config/config.js";
import type { RuntimeEnv } from "../../runtime.js";
import { resolveChannelConfigWrites } from "../../channels/plugins/config-writes.js";
import { loadConfig } from "../../config/config.js";
import { writeConfigFile } from "../../config/io.js";
import { warn } from "../../globals.js";
import { migrateTelegramGroupConfig } from "../group-migration.js";

export interface GroupManagerConfig {
  cfg: OpenClawConfig;
  accountId?: string;
  runtime: RuntimeEnv;
}

export function createGroupManager(config: GroupManagerConfig) {
  const { cfg, accountId, runtime } = config;

  return {
    handleGroupMigration,
  };

  async function handleGroupMigration(ctx: Context): Promise<void> {
    const msg = ctx.message;
    if (!msg?.migrate_to_chat_id) return;

    const oldChatId = String(msg.chat.id);
    const newChatId = String(msg.migrate_to_chat_id);
    const chatTitle = msg.chat.title ?? "Unknown";

    runtime.log?.(warn(`[telegram] Group migrated: "${chatTitle}" ${oldChatId} → ${newChatId}`));

    if (!resolveChannelConfigWrites({ cfg, channelId: "telegram", accountId })) {
      runtime.log?.(warn("[telegram] Config writes disabled; skipping group config migration."));
      return;
    }

    const currentConfig = loadConfig();
    const migration = migrateTelegramGroupConfig({
      cfg: currentConfig,
      accountId,
      oldChatId,
      newChatId,
    });

    if (migration.migrated) {
      runtime.log?.(warn(`[telegram] Migrating group config from ${oldChatId} to ${newChatId}`));
      migrateTelegramGroupConfig({ cfg, accountId, oldChatId, newChatId });
      await writeConfigFile(currentConfig);
      runtime.log?.(warn("[telegram] Group config migrated and saved successfully"));
    } else if (migration.skippedExisting) {
      runtime.log?.(
        warn(
          `[telegram] Group config already exists for ${newChatId}; leaving ${oldChatId} unchanged`,
        ),
      );
    } else {
      runtime.log?.(
        warn(`[telegram] No config found for old group ID ${oldChatId}, migration logged only`),
      );
    }
  }
}
