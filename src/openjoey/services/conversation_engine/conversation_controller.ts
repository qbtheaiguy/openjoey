/**
 * OpenJoey Conversation Controller - Main orchestrator
 * Coordinates intent parsing, tool routing, and response generation
 */

import { parseIntent } from "./intent_parser.js";
import { generateResponse, formatTelegramResponse } from "./response_generator.js";
import { storeSessionContext, getSessionContext, isContextValid } from "./session_memory.js";
import { routeToServices, type AnalysisContext } from "./tool_router.js";

export interface ConversationRequest {
  userId: string;
  message: string;
  timestamp: string;
}

export interface ConversationResponse {
  message: string;
  suggestions?: string[];
  context?: AnalysisContext;
}

/**
 * Main conversation handler - implements two-call Kimi architecture
 */
export async function handleConversation(
  userId: string,
  message: string,
): Promise<ConversationResponse> {
  try {
    console.log(`Conversation started for user ${userId}:`, message);

    // Step 1: Intent Parsing (Kimi Call #1)
    const startTime = Date.now();
    const parsedIntent = await parseIntent(message);
    const parseTime = Date.now() - startTime;

    console.log(`Intent parsed in ${parseTime}ms:`, parsedIntent);

    // Step 2: Check session context for follow-up
    const sessionContext = await getSessionContext(userId);
    const hasValidContext = isContextValid(sessionContext.timestamp);

    // Step 3: Tool Routing - Call backend services
    const serviceStartTime = Date.now();
    const analysisContext = await routeToServices(parsedIntent, userId);
    const serviceTime = Date.now() - serviceStartTime;

    console.log(`Services executed in ${serviceTime}ms`);

    // Step 4: Response Generation (Kimi Call #2)
    const responseStartTime = Date.now();
    const generatedResponse = await generateResponse(analysisContext, message);
    const responseTime = Date.now() - responseStartTime;

    console.log(`Response generated in ${responseTime}ms`);

    // Step 5: Format for Telegram
    const formattedMessage = formatTelegramResponse(generatedResponse, parsedIntent.asset_symbol);

    // Step 6: Store session context
    await storeSessionContext(userId, {
      last_asset: parsedIntent.asset_symbol,
      last_intent: parsedIntent.intent,
      last_analysis_context: analysisContext,
    });

    const totalTime = Date.now() - startTime;
    console.log(`Total conversation time: ${totalTime}ms`);

    return {
      message: formattedMessage,
      suggestions: generatedResponse.suggestions,
      context: analysisContext,
    };
  } catch (error) {
    console.error("Error in conversation controller:", error);

    return {
      message: "I'm having trouble understanding your request. Could you rephrase that?",
      suggestions: ["Analyze BTC", "Market overview", "Portfolio check", "Help"],
    };
  }
}

/**
 * Handle fallback for unclear intents
 */
export async function handleFallback(userId: string): Promise<ConversationResponse> {
  return {
    message:
      "I can help you with:\n\n• Asset analysis (e.g., 'Should I buy BTC?')\n• Portfolio status\n• Market overview\n• Trending assets\n• Price alerts\n\nWhat would you like to know?",
    suggestions: [
      "Analyze BTC",
      "Market overview",
      "Portfolio check",
      "Trending assets",
      "Set alerts",
    ],
  };
}

/**
 * Performance monitoring
 */
export function logPerformanceMetrics(
  userId: string,
  parseTime: number,
  serviceTime: number,
  responseTime: number,
  totalTime: number,
): void {
  const metrics = {
    userId,
    timestamp: new Date().toISOString(),
    parseTime,
    serviceTime,
    responseTime,
    totalTime,
  };

  // Log performance (could be stored in analytics table)
  if (totalTime > 10000) {
    // 10 seconds
    console.warn("Slow conversation detected:", metrics);
  }

  console.log("Performance metrics:", metrics);
}
