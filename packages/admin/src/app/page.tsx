import {
  TrendingUp,
  Users,
  Zap,
  DollarSign,
  ChevronRight,
  Activity,
  AlertTriangle,
  Server,
  Cpu,
  CheckCircle,
} from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { getOpenJoeyMonitoringStats } from "@/actions/openjoey-monitoring";

function formatVal(value: number | null, suffix = ""): string {
  if (value === null) {
    return "No data";
  }
  return `${value.toLocaleString()}${suffix}`;
}

function getStatusColor(status: "healthy" | "warning" | "critical"): string {
  switch (status) {
    case "healthy":
      return "#22c55e";
    case "warning":
      return "#f59e0b";
    case "critical":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export default async function Dashboard() {
  const [stats, monitoring] = await Promise.all([
    getDashboardStats(),
    getOpenJoeyMonitoringStats(),
  ]);

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

      {/* OpenJoey System Health - Rule 12 Observability */}
      <section className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={20} />
              OpenJoey System Health
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              Agent monitoring, queue status, API health, resource usage
            </p>
          </div>
          {monitoring ? (
            <div
              className="glass"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius)",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: getStatusColor(monitoring.overallStatus),
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: getStatusColor(monitoring.overallStatus),
                  borderRadius: "50%",
                }}
              />
              {monitoring.overallStatus.toUpperCase()}
            </div>
          ) : (
            <div
              className="glass"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius)",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#6b7280",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#6b7280",
                  borderRadius: "50%",
                }}
              />
              UNAVAILABLE
            </div>
          )}
        </div>

        {monitoring ? (
          <>
            {/* Status Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {monitoring.reports.map((report) => (
                <div
                  key={report.system}
                  className="card"
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderLeft: `3px solid ${getStatusColor(report.status)}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{report.system}</span>
                    {report.status === "healthy" ? (
                      <CheckCircle size={16} color="#22c55e" />
                    ) : (
                      <AlertTriangle size={16} color={getStatusColor(report.status)} />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {report.metrics
                      .slice(0, 2)
                      .map((metric: { name: string; value: number; unit: string }) => (
                        <div
                          key={metric.name}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                          }}
                        >
                          <span style={{ color: "var(--text-muted)" }}>{metric.name}:</span>
                          <span>
                            {metric.value.toFixed(1)} {metric.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Alerts & Recovery Actions */}
            {(monitoring.reports.some((r) => r.alerts.length > 0) ||
              monitoring.actions.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Alerts */}
                {monitoring.reports.some((r) => r.alerts.length > 0) && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "var(--radius)",
                      border: "1px solid #fee2e2",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#991b1b",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertTriangle size={16} />
                      Active Alerts
                    </h4>
                    <ul
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#7f1d1d",
                      }}
                    >
                      {monitoring.reports
                        .flatMap((r) => r.alerts)
                        .map((alert, i) => (
                          <li
                            key={i}
                            style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}
                          >
                            <span>•</span>
                            <span>{alert}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Recovery Actions */}
                {monitoring.actions.length > 0 && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#eff6ff",
                      borderRadius: "var(--radius)",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1e40af",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Server size={16} />
                      Suggested Recovery Actions
                    </h4>
                    <ul
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#1e3a8a",
                      }}
                    >
                      {monitoring.actions.map((action, i) => (
                        <li
                          key={i}
                          style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}
                        >
                          <span>→</span>
                          <span>
                            {action.type === "notify_admin" && "Notify admin"}
                            {action.type === "restart_agent" && `Restart agent: ${action.agentId}`}
                            {action.type === "scale_workers" && `Scale workers: +${action.count}`}
                            {action.type === "clear_queue" && "Clear queue"}
                            {action.type === "rotate_api" &&
                              `Rotate API: ${action.from} → ${action.to}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-soft)",
              borderRadius: "var(--radius)",
            }}
          >
            <Server size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <p>Monitoring data unavailable. Check that the OpenJoey backend is running.</p>
          </div>
        )}
      </section>
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
