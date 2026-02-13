import type { OpenClawConfig } from "../config/config.js";
import type { WizardPrompter } from "../wizard/prompts.js";

const DEFAULT_GATEWAY_URL = "ws://127.0.0.1:18789";

function ensureWsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_GATEWAY_URL;
  }
  return trimmed;
}

export async function promptRemoteGatewayConfig(
  cfg: OpenClawConfig,
  prompter: WizardPrompter,
): Promise<OpenClawConfig> {
  let suggestedUrl = cfg.gateway?.remote?.url ?? DEFAULT_GATEWAY_URL;

  const selection = await prompter.select({
    message: "Configure gateway URL",
    options: [
      { value: "manual", label: "Enter URL manually" },
      { value: "default", label: `Use default (${DEFAULT_GATEWAY_URL})` },
    ],
  });

  if (selection === "default") {
    suggestedUrl = DEFAULT_GATEWAY_URL;
  } else {
    const input = await prompter.text({
      message: "Gateway WebSocket URL",
      placeholder: suggestedUrl,
      initialValue: suggestedUrl,
      validate: (v) => {
        if (!v.trim()) {
          return "URL is required";
        }
        if (!v.startsWith("ws://") && !v.startsWith("wss://")) {
          return "URL must start with ws:// or wss://";
        }
        return undefined;
      },
    });
    suggestedUrl = ensureWsUrl(input);
  }

  return {
    ...cfg,
    gateway: {
      ...cfg.gateway,
      remote: {
        ...cfg.gateway?.remote,
        url: suggestedUrl,
      },
    },
  };
}
