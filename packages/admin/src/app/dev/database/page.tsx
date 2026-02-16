"use client";

import { Database } from "lucide-react";
import { useEffect } from "react";
import { DatabaseStats, DatabaseActions, RecentUsers } from "@/components/features/database";
import { Header, Message, Card } from "@/components/ui";
import { useApi } from "@/hooks";

export default function DatabasePage() {
  const { data, loading, error, execute } = useApi<any>("/api/database");

  useEffect(() => {
    execute();
  }, []);

  const handleAction = async (action: string) => {
    await fetch("/api/database/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    execute();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Header
        title="Database Console"
        icon={Database}
        description="Direct access to Supabase database"
      />
      <Message message={error} type="error" />
      <DatabaseStats stats={data} />
      <Card>
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Recent Users</h3>
        <RecentUsers users={data?.recentUsers || []} />
      </Card>
      <Card>
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Actions</h3>
        <DatabaseActions onAction={handleAction} loading={loading} />
      </Card>
    </div>
  );
}
