/**
 * Kimi K2.5 API Client
 * Moonshot AI integration for OpenJoey V1
 */

export interface KimiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: KimiMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface KimiRequestOptions {
  model?: string;
  messages: KimiMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Kimi K2.5 model ID
export const KIMI_K25_MODEL = "kimi-k2.5";

/**
 * Call Kimi K2.5 API
 */
export async function callKimiAPI(options: KimiRequestOptions): Promise<KimiResponse> {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Moonshot/Kimi API key not found. Set MOONSHOT_API_KEY or KIMI_API_KEY environment variable.",
    );
  }

  const requestBody = {
    model: options.model || KIMI_K25_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 1024,
    stream: options.stream ?? false,
  };

  try {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as KimiResponse;
    return data;
  } catch (error) {
    console.error("Error calling Kimi API:", error);
    throw error;
  }
}

/**
 * Simple wrapper for single-turn conversations
 */
export async function askKimi(
  userMessage: string,
  systemPrompt?: string,
  temperature?: number,
): Promise<string> {
  const messages: KimiMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: userMessage });

  const response = await callKimiAPI({
    messages,
    temperature,
  });

  return response.choices[0]?.message?.content || "";
}
