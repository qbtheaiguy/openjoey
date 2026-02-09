"use server";

import { getAdminDB } from "@/lib/db";

export type UserRow = {
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  display_name: string | null;
  status: string;
  tier: string;
  created_at: string;
  updated_at: string;
};

export async function getUsers(
  query?: string,
): Promise<{ users: UserRow[]; total: number } | null> {
  const db = getAdminDB();
  if (!db) return null;

  let filter =
    "order=created_at.desc&limit=100&select=id,telegram_id,telegram_username,display_name,status,tier,created_at,updated_at";
  if (query) {
    // PostgREST: use or for multi-column filter. telegram_id is numeric.
    if (!isNaN(Number(query))) {
      filter += `&telegram_id=eq.${query}`;
    } else {
      filter += `&telegram_username=ilike.*${query}*`;
    }
  }

  try {
    const [users, total] = await Promise.all([
      db.get<UserRow>("users", filter),
      db.count("users", query ? `telegram_username=ilike.*${query}*` : ""),
    ]);
    return { users: users || [], total };
  } catch (err) {
    console.error("getUsers:", err);
    return null;
  }
}
