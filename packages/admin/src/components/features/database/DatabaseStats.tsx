import { Grid, StatCard } from "@/components/ui";

interface Stats {
  totalTables: number;
  totalUsers: number;
  totalConversations: number;
  connected: boolean;
}

export function DatabaseStats({ stats }: { stats: Stats | null }) {
  return (
    <Grid cols={4}>
      <StatCard value={stats?.totalTables || 0} label="Tables" />
      <StatCard value={stats?.totalUsers || 0} label="Users" />
      <StatCard value={stats?.totalConversations || 0} label="Conversations" />
      <StatCard
        value={stats?.connected ? "Connected" : "Disconnected"}
        label="Status"
        color={stats?.connected ? "#22c55e" : "#ef4444"}
      />
    </Grid>
  );
}
