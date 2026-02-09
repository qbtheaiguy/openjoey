import { TrendingUp, Users, Zap, DollarSign, ChevronRight } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";

function formatVal(value: number | null, suffix = ""): string {
  if (value === null) return "No data";
  return `${value.toLocaleString()}${suffix}`;
}

export default async function Dashboard() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading dashboard. Check Supabase connection and env (SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY).
        </h2>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Dashboard Overview</h2>
          <p style={{ color: "var(--text-muted)" }}>Live data from Supabase. No mock data.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div
            className="glass"
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#22c55e",
                borderRadius: "50%",
              }}
            />
            Live data
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        <MetricCard
          title="Est. Revenue"
          value={stats.revenue !== null ? `$${stats.revenue.toLocaleString()}` : "No data"}
          icon={<DollarSign size={20} />}
        />
        <MetricCard
          title="Total Users"
          value={formatVal(stats.totalUsers)}
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Total Usage"
          value={formatVal(stats.totalUsage)}
          icon={<Zap size={20} />}
        />
        <MetricCard
          title="Success Rate"
          value={stats.successRate !== null ? `${stats.successRate}%` : "No data"}
          icon={<TrendingUp size={20} />}
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <section
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: "20px", overflow: "hidden" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "18px" }}>Recent Skill Executions</h3>
            <a
              href="/logs"
              style={{
                fontSize: "13px",
                color: "var(--accent)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                border: "none",
                background: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              View all <ChevronRight size={14} />
            </a>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Skill</th>
                  <th>Result</th>
                  <th>Duration</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}
                    >
                      No data
                    </td>
                  </tr>
                ) : (
                  stats.recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td
                        style={{
                          fontWeight: 600,
                          fontSize: "12px",
                          maxWidth: "120px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={log.user_id}
                      >
                        {log.user_id.slice(0, 8)}…
                      </td>
                      <td>{log.skill_name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: log.success ? "#dcfce7" : "#fee2e2",
                            color: log.success ? "#166534" : "#991b1b",
                          }}
                        >
                          {log.success ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        {log.execution_time_ms != null ? `${log.execution_time_ms}ms` : "—"}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <section className="card">
            <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Top Skills</h3>
            {stats.topSkills.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No data</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {stats.topSkills.map((s) => {
                  const total = stats.totalUsage || 1;
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div
                      key={s.name}
                      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ textTransform: "capitalize" }}>
                          {s.name.replace(/-/g, " ")}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {s.count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          backgroundColor: "var(--bg-soft)",
                          borderRadius: "9999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            height: "100%",
                            backgroundColor: "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            backgroundColor: "var(--bg-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{title}</p>
        <h4 style={{ fontSize: "24px" }}>{value}</h4>
      </div>
    </div>
  );
}
