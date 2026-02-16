/**
 * OpenJoey Session Memory - Conversation context management
 * Stores and retrieves conversation state for follow-up questions
 */

import { getOpenJoeyDB } from "../../supabase-client.js";

export interface SessionMemory {
  last_asset?: string;
  last_intent?: string;
  last_analysis_context?: any;
  timestamp: string;
}

/**
 * Store conversation context in session
 */
export async function storeSessionContext(
  userId: string,
  context: Partial<SessionMemory>,
): Promise<void> {
  try {
    const db = getOpenJoeyDB();

    const sessionData = {
      last_asset: context.last_asset,
      last_intent: context.last_intent,
      last_analysis_context: context.last_analysis_context,
      timestamp: new Date().toISOString(),
    };

    // Update session metadata
    await db.update("sessions", `user_id=eq.${userId}`, {
      metadata: sessionData,
      last_activity_at: new Date().toISOString(),
    });

    console.log("Session context stored for user:", userId);
  } catch (error) {
    console.error("Error storing session context:", error);
  }
}

/**
 * Retrieve conversation context from session
 */
export async function getSessionContext(userId: string): Promise<SessionMemory> {
  try {
    const db = getOpenJoeyDB();

    const sessions = await db.get(
      "sessions",
      `user_id=eq.${userId}&order=last_activity_at.desc&limit=1`,
    );

    if (sessions && sessions.length > 0) {
      const session = sessions[0] as { metadata?: any; last_activity_at?: string };
      const metadata = session.metadata || {};

      return {
        last_asset: metadata.last_asset,
        last_intent: metadata.last_intent,
        last_analysis_context: metadata.last_analysis_context,
        timestamp: session.last_activity_at || new Date().toISOString(),
      };
    }

    return {
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error retrieving session context:", error);
    return {
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Clear conversation context
 */
export async function clearSessionContext(userId: string): Promise<void> {
  try {
    const db = getOpenJoeyDB();

    await db.update("sessions", `user_id=eq.${userId}`, {
      metadata: {},
      last_activity_at: new Date().toISOString(),
    });

    console.log("Session context cleared for user:", userId);
  } catch (error) {
    console.error("Error clearing session context:", error);
  }
}

/**
 * Check if context is still valid (5 minutes)
 */
export function isContextValid(timestamp: string): boolean {
  const sessionTime = new Date(timestamp);
  const now = new Date();
  const diffMinutes = (now.getTime() - sessionTime.getTime()) / (1000 * 60);

  return diffMinutes < 5; // Valid for 5 minutes
}
