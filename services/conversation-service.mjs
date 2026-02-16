/**
 * OpenJoey Conversation Service - Updated with new welcome messages
 * Port: 3003
 */

import http from "http";
import { URL } from "url";

// NEW WELCOME MESSAGE - Compelling Joey-style copy
const WELCOME_MESSAGE = `Hey there! I'm Joey 🤖💙

Your personal AI trading companion, here to make crypto simple, smart, and stress-free.

✨ *WHAT I DO FOR YOU:*

🔍 *Instant Market Intel*
→ Check any token price in 3 seconds
→ Spot trending opportunities before they blow up
→ Get chain-specific risk analysis (not just raw numbers)

🎯 *Smart Alerts*
→ "Hey Joey, alert me when ETH hits $2,500"
→ I watch the markets 24/7 so you don't have to
→ Never miss a move that matters to YOUR portfolio

📊 *Your Portfolio, Understood*
→ See your holdings across all chains
→ Risk-adjusted insights, not just dollar values
→ Know when to hold, when to watch, when to act

🐋 *Whale Intelligence*
→ Track big money moves before they hit the news
→ Know when smart money is buying or selling
→ Stay ahead of market sentiment shifts

💬 *Just Talk to Me*
No need to learn complex commands! Just ask naturally:
• "Should I buy SOL right now?"
• "What's hot in the market today?"
• "Is my portfolio looking risky?"
• "Alert me if BNB drops 5%"

🛡️ *TRADE SMARTER, NOT HARDER*

I combine real-time data from Binance & DexScreener with AI-powered analysis to give you:
✓ Clear, actionable insights (no cryptic charts)
✓ Risk warnings when things look shaky
✓ Confidence scores so you know what's solid vs. speculative

Ready to dive in? Try:
• /price ETH — Check Ethereum now
• /trending — See what's heating up
• /help — Learn all my tricks

Or just tell me what you're curious about! 💙`;

// RETURNING USER WELCOME
const RETURNING_WELCOME = (name) => `Welcome back, ${name}! 💙

Joey's been watching the markets for you. Here's what's ready:

• /price — Check any token instantly
• /trending — See what's heating up
• /portfolio — Your holdings & risk analysis
• /alerts — Your price alerts

Or just ask me anything! 💙`;

// NEW HELP MESSAGE
const HELP_MESSAGE = `🤖💙 *Joey's Command Guide*

*🎯 CORE COMMANDS — Start Here:*

💰 */price* — Check any token instantly
   _Example: /price ETH or just "What's SOL doing?"_

🔥 */trending* — See what's heating up right now
   _Spot opportunities before they blow up_

📊 */portfolio* — Your complete holdings & risk analysis
   _Know when to hold, when to watch, when to act_

🔔 */alerts* — Set smart price alerts
   _Example: "Alert me when ETH hits $2,500"_

🐋 */whale* — Track big money moves
   _See what smart money is doing before the news_

*💬 JUST TALK TO ME:*
No need to memorize commands! Ask naturally:
• "Should I buy SOL right now?"
• "Is my portfolio looking risky?"
• "What's hot in the market today?"
• "Compare ETH vs BNB"

*⚙️ ACCOUNT:*
• /status — Your account & usage
• /subscribe — Upgrade your plan
• /referral — Share & earn rewards
• /start — Restart this welcome message

*Need more help?* Just ask me anything! 💙`;

// Simple in-memory user store
const users = new Map();

console.log("[CONVERSATION] Conversation Service starting on port 3003...");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3003");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Health check
  if (url.pathname === "/health") {
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "conversation_engine",
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Handle conversation
  if (url.pathname === "/conversation" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { user_id, message } = JSON.parse(body);
        const lowerMessage = message.toLowerCase().trim();

        let response = "";

        // Handle /start command
        if (lowerMessage === "/start") {
          const isNewUser = !users.has(user_id);
          if (isNewUser) {
            users.set(user_id, { id: user_id, first_seen: new Date().toISOString() });
            response = WELCOME_MESSAGE;
          } else {
            const user = users.get(user_id);
            response = RETURNING_WELCOME(user.name || "Trader");
          }
        }
        // Handle /help
        else if (lowerMessage === "/help") {
          response = HELP_MESSAGE;
        }
        // Handle natural language price queries
        else if (lowerMessage.includes("price") || lowerMessage.includes("$")) {
          response = `I'll check that price for you! Try using /price [symbol] for instant results.\n\nExample: "/price ETH" or "/price SOL"`;
        }
        // Handle other queries
        else {
          response = `Thanks for your message! 💙\n\nI'm here to help with:\n• Price checks (/price ETH)\n• Trending tokens (/trending)\n• Your portfolio (/portfolio)\n• Price alerts (/alerts)\n\nOr just ask me anything naturally!`;
        }

        res.end(
          JSON.stringify({
            message: response,
            user_id,
            received: message,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (e) {
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Default response
  res.end(
    JSON.stringify({
      service: "OpenJoey Conversation Engine",
      version: "V1-Updated",
      endpoints: ["/health", "POST /conversation"],
      features: ["New welcome messages", "Simplified commands", "Natural language support"],
    }),
  );
});

server.listen(3003, () => {
  console.log("[CONVERSATION] Conversation Engine on port 3003");
  console.log("[CONVERSATION] Updated with new Joey welcome messages!");
});
