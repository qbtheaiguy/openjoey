import {
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Server,
  Cpu,
  Zap,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  getMonitoringLogs,
  getMonitoringStats,
  type MonitoringLogEntry,
} from "@/actions/monitoring-logs";
import { FilterSelect } from "@/components/FilterSelect";

export const metadata = {
  title: "System Monitoring | OpenJoey Admin",
  description: "OpenJoey system health monitoring and event logs",
};

const LEVEL_COLORS = {
  info: { bg: "#eff6ff", text: "#1e40af", border: "#dbeafe", icon: Info },
  warning: { bg: "#fffbeb", text: "#92400e", border: "#fef3c7", icon: AlertTriangle },
  error: { bg: "#fef2f2", text: "#991b1b", border: "#fee2e2", icon: AlertCircle },
  critical: { bg: "#fdf2f8", text: "#be185d", border: "#fce7f3", icon: AlertCircle },
};

const CATEGORY_ICONS = {
  api: Server,
  queue: Zap,
  agent: Cpu,
  resource: Activity,
  rate_limit: Clock,
  system: Server,
};

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; category?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const level = (params.level as MonitoringLogEntry["level"] | "all") || "all";
  const category = (params.category as MonitoringLogEntry["category"] | "all") || "all";
  const limit = parseInt(params.limit || "100", 10);

  const [logs, stats] = await Promise.all([
    getMonitoringLogs({ level, category, limit }),
    getMonitoringStats(),
  ]);

  const hasActiveFilters = level !== "all" || category !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h2
            style={{
              fontSize: "28px",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Activity size={28} />
            System Monitoring
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Real-time logs, warnings, and health events from OpenJoey
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/"
            className="glass"
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Stats Overview */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <StatCard
          title="Total Events"
          value={stats.total.toLocaleString()}
          subtitle={`${stats.last24h} in last 24h`}
          color="#6b7280"
        />
        <StatCard
          title="Warnings"
          value={stats.byLevel.warning.toLocaleString()}
          subtitle={`${stats.byLevel.error + stats.byLevel.critical} critical`}
          color="#f59e0b"
        />
        <StatCard
          title="API Issues"
          value={(stats.byCategory.api + stats.byCategory.rate_limit).toLocaleString()}
          subtitle={`${stats.byCategory.rate_limit} rate limited`}
          color="#3b82f6"
        />
        <StatCard
          title="System Health"
          value={stats.byLevel.critical > 0 ? "⚠️ Issues" : "✓ Healthy"}
          subtitle={`${stats.byCategory.agent} agent events`}
          color={stats.byLevel.critical > 0 ? "#ef4444" : "#22c55e"}
        />
      </section>

      {/* Category Breakdown */}
      <section className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "16px", fontWeight: 600 }}>
          Events by Category
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
          {Object.entries(stats.byCategory).map(([cat, count]) => {
            const Icon = CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS];
            return (
              <div
                key={cat}
                style={{
                  padding: "16px",
                  backgroundColor: "var(--bg-soft)",
                  borderRadius: "var(--radius)",
                  textAlign: "center",
                }}
              >
                <Icon size={20} style={{ marginBottom: "8px", color: "var(--text-muted)" }} />
                <div style={{ fontSize: "20px", fontWeight: 700 }}>{count}</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {cat.replace("_", " ")}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={18} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: "14px" }}>Filters:</span>
          </div>

          <FilterSelect
            label="Level"
            value={level}
            options={[
              { value: "all", label: "All Levels" },
              { value: "info", label: "Info" },
              { value: "warning", label: "Warning" },
              { value: "error", label: "Error" },
              { value: "critical", label: "Critical" },
            ]}
          />
          <FilterSelect
            label="Category"
            value={category}
            options={[
              { value: "all", label: "All Categories" },
              { value: "api", label: "API" },
              { value: "queue", label: "Queue" },
              { value: "agent", label: "Agent" },
              { value: "resource", label: "Resource" },
              { value: "rate_limit", label: "Rate Limit" },
              { value: "system", label: "System" },
            ]}
          />
          <FilterSelect
            label="Limit"
            value={limit.toString()}
            options={[
              { value: "50", label: "50" },
              { value: "100", label: "100" },
              { value: "250", label: "250" },
              { value: "500", label: "500" },
            ]}
            paramName="limit"
          />

          {hasActiveFilters && (
            <Link
              href="/monitoring"
              style={{
                marginLeft: "auto",
                fontSize: "13px",
                color: "var(--accent)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <RefreshCw size={14} />
              Clear filters
            </Link>
          )}
        </div>
      </section>

      {/* Logs Table */}
      <section className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
            Event Logs{" "}
            {logs.length > 0 && (
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                ({logs.length} shown)
              </span>
            )}
          </h3>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Auto-refreshes every 30s
          </span>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <Info size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>No logs found</p>
            <p style={{ fontSize: "14px" }}>
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Events will appear here when monitoring detects issues"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Level</th>
                  <th style={{ width: "100px" }}>Category</th>
                  <th style={{ width: "160px" }}>Time</th>
                  <th>Message</th>
                  <th style={{ width: "120px" }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const levelStyle = LEVEL_COLORS[log.level];
                  const CategoryIcon = CATEGORY_ICONS[log.category];

                  return (
                    <tr key={log.id}>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: levelStyle.bg,
                            color: levelStyle.text,
                            border: `1px solid ${levelStyle.border}`,
                            textTransform: "uppercase",
                          }}
                        >
                          <levelStyle.icon size={12} />
                          {log.level}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                          }}
                        >
                          <CategoryIcon size={14} />
                          {log.category.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>{log.message}</div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              marginTop: "4px",
                              fontFamily: "monospace",
                            }}
                          >
                            {JSON.stringify(log.details, null, 2).slice(0, 200)}
                            {JSON.stringify(log.details).length > 200 && "..."}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>{log.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>{title}</p>
      <div style={{ fontSize: "28px", fontWeight: 700, color, marginBottom: "4px" }}>{value}</div>
      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{subtitle}</p>
    </div>
  );
}
