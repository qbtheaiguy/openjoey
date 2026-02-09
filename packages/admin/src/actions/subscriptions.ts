"use server";

import { getAdminDB } from "@/lib/db";

export type SubscriptionRow = {
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  status: string;
};

export async function getSubscriptions(): Promise<{
  rows: SubscriptionRow[];
  total: number;
} | null> {
  const db = getAdminDB();
  if (!db) return null;
  try {
    const [rows, total] = await Promise.all([
      db.get<SubscriptionRow>(
        "users",
        "order=updated_at.desc&limit=100&select=id,telegram_id,telegram_username,tier,stripe_customer_id,stripe_subscription_id,subscription_started_at,subscription_ends_at,status",
      ),
      db.count("users"),
    ]);
    return { rows: rows || [], total };
  } catch (err) {
    console.error("getSubscriptions:", err);
    return null;
  }
}
