import { callKimiAPI } from "../../kimi-client.js";

export interface ParsedIntent {
  intent:
    | "asset_analysis"
    | "portfolio_question"
    | "market_overview"
    | "trending_request"
    | "alert_request"
    | "general_trading_question";
  asset_symbol?: string;
  requested_data?: string[];
  user_action?: string;
  confidence: number;
}

/**
 * Parse user intent using Kimi K2.5
 */
export async function parseIntent(userMessage: string): Promise<ParsedIntent> {
  const systemPrompt = `You are an intent parser for a trading assistant.
Return ONLY valid JSON.

Detect:
intent
asset_symbol
requested_data
user_action
confidence

Allowed intents:
- asset_analysis
- portfolio_question
- market_overview
- trending_request
- alert_request
- general_trading_question

Rules:
- Extract cryptocurrency symbols (BTC, ETH, SOL, RAY, AVAX, etc.)
- Detect user's intended action
- Rate confidence 0.0 to 1.0
- Return empty array for requested_data if unclear
- Use null for asset_symbol if not found

Example input: "Should I buy BTC right now?"
Example output:
{
  "intent": "asset_analysis",
  "asset_symbol": "BTC",
  "requested_data": ["analysis", "recommendation"],
  "user_action": "consider_buy",
  "confidence": 0.95
}`;

  try {
    // Call Kimi K2.5 for intent parsing
    const response = await callKimiAPI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1, // Low temperature for consistent structured output
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Kimi response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize
    const result: ParsedIntent = {
      intent: parsed.intent || "general_trading_question",
      asset_symbol: parsed.asset_symbol || undefined,
      requested_data: parsed.requested_data || undefined,
      user_action: parsed.user_action || undefined,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    };

    console.log("Intent parsed by Kimi K2.5:", result);
    return result;
  } catch (error) {
    console.error("Error parsing intent with Kimi:", error);

    // Fallback to rule-based parsing if Kimi fails
    console.log("Falling back to rule-based parsing...");
    return parseIntentFallback(userMessage);
  }
}

/**
 * Fallback rule-based intent parsing
 */
function parseIntentFallback(userMessage: string): ParsedIntent {
  const lowerMessage = userMessage.toLowerCase();
  const upperMessage = userMessage.toUpperCase();

  // Asset symbol extraction
  const cryptoSymbols = ["BTC", "ETH", "SOL", "RAY", "AVAX", "MATIC", "DOT", "LINK", "UNI", "AAVE"];
  let assetSymbol: string | undefined;

  for (const symbol of cryptoSymbols) {
    if (upperMessage.includes(symbol)) {
      assetSymbol = symbol;
      break;
    }
  }

  // Pattern matching for $SYMBOL
  const symbolMatch = upperMessage.match(/\$([A-Z]{2,10})/);
  if (symbolMatch && !assetSymbol) {
    assetSymbol = symbolMatch[1];
  }

  // Intent detection
  let intent: ParsedIntent["intent"];
  let userAction: string | undefined;
  let confidence = 0.5;

  if (
    assetSymbol &&
    (lowerMessage.includes("buy") ||
      lowerMessage.includes("sell") ||
      lowerMessage.includes("should i") ||
      lowerMessage.includes("what about") ||
      lowerMessage.includes("analysis") ||
      lowerMessage.includes("price") ||
      lowerMessage.includes("signal"))
  ) {
    intent = "asset_analysis";
    userAction = lowerMessage.includes("buy")
      ? "consider_buy"
      : lowerMessage.includes("sell")
        ? "consider_sell"
        : "analyze";
    confidence = 0.8;
  } else if (
    lowerMessage.includes("portfolio") ||
    lowerMessage.includes("holdings") ||
    lowerMessage.includes("my assets")
  ) {
    intent = "portfolio_question";
    userAction = "check_portfolio";
    confidence = 0.8;
  } else if (
    lowerMessage.includes("trending") ||
    lowerMessage.includes("hot") ||
    lowerMessage.includes("popular")
  ) {
    intent = "trending_request";
    userAction = "get_trends";
    confidence = 0.8;
  } else if (
    lowerMessage.includes("market") ||
    lowerMessage.includes("overview") ||
    lowerMessage.includes("summary")
  ) {
    intent = "market_overview";
    userAction = "get_overview";
    confidence = 0.7;
  } else if (lowerMessage.includes("alert") || lowerMessage.includes("notify")) {
    intent = "alert_request";
    userAction = "setup_alert";
    confidence = 0.8;
  } else {
    intent = "general_trading_question";
    userAction = "general_help";
    confidence = 0.5;
  }

  // Requested data extraction
  const requestedData: string[] = [];
  if (lowerMessage.includes("price")) requestedData.push("price");
  if (lowerMessage.includes("sentiment")) requestedData.push("sentiment");
  if (lowerMessage.includes("analysis")) requestedData.push("analysis");
  if (lowerMessage.includes("recommendation")) requestedData.push("recommendation");
  if (lowerMessage.includes("signal")) requestedData.push("signal");
  if (lowerMessage.includes("trend")) requestedData.push("trend");

  return {
    intent,
    asset_symbol: assetSymbol,
    requested_data: requestedData.length > 0 ? requestedData : undefined,
    user_action: userAction,
    confidence,
  };
}

/**
 * Validate parsed intent
 */
export function validateIntent(intent: ParsedIntent): boolean {
  return (
    intent &&
    [
      "asset_analysis",
      "portfolio_question",
      "market_overview",
      "trending_request",
      "alert_request",
      "general_trading_question",
    ].includes(intent.intent) &&
    intent.confidence >= 0 &&
    intent.confidence <= 1
  );
}
