"use server";

import { getAdminDB } from "@/lib/db";

export type PolicyRow = {
  id: string;
  display_name: string;
  description: string | null;
  category: string | null;
  allowed_tiers: string[] | null;
  blocked_tiers: string[] | null;
  cost_tier: string | null;
  is_active: boolean | null;
};

export async function getTierPolicies(): Promise<{ policies: PolicyRow[] } | null> {
  const db = getAdminDB();
  if (!db) {
    return null;
  }
  try {
    const policies = await db.get<PolicyRow>(
      "skill_catalog",
      "order=id&select=id,display_name,description,category,allowed_tiers,blocked_tiers,cost_tier,is_active",
    );
    return { policies: policies || [] };
  } catch (err) {
    console.error("getTierPolicies:", err);
    return null;
  }
}
