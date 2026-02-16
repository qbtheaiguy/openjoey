import { FileText, Download, Filter, Search, Calendar, Clock } from "lucide-react";
import { getGatewayLogs } from "@/actions/gateway-logs";
import { FilterSelect } from "@/components/FilterSelect";

export const metadata = {
  title: "Gateway Logs | OpenJoey Admin",
  description: "Real-time OpenJoey gateway logs and debugging",
};

const LOG_LEVELS = {
  debug: { color: "#6b7280", label: "Debug" },
  info: { color: "#3b82f6", label: "Info" },
  warn: { color: "#f59e0b", label: "Warning" },
  error: { color: "#ef4444", label: "Error" },
};

export default async function GatewayLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; search?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const level = params.level || "all";
  const search = params.search || "";
  const limit = parseInt(params.limit || "100", 10);

  const logs = await getGatewayLogs({ level, search, limit });

  if (!logs) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading gateway logs. Check connection to Hetzner server.
        </h2>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Gateway Logs</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Live logs from OpenJoey gateway on Hetzner (116.203.215.213:18789)
        </p>
      </header>

      <section style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <FilterSelect
          value={level}
          options={[
            { value: "all", label: "All Levels" },
            ...Object.entries(LOG_LEVELS).map(([key, val]) => ({ value: key, label: val.label })),
          ]}
          param="level"
        />

        <div
          style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1, minWidth: "300px" }}
        >
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search logs..."
            defaultValue={search}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid var(--border-soft)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-soft)",
            }}
          />
        </div>

        <button
          className="glass"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Download size={16} />
          Export
        </button>
      </section>

      <section className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Component</th>
              <th>Message</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}
                >
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const levelConfig = LOG_LEVELS[log.level] || LOG_LEVELS.debug;

                return (
                  <tr key={index}>
                    <td
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${levelConfig.color}20`,
                          color: levelConfig.color,
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {levelConfig.label}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px" }}>{log.component}</td>
                    <td style={{ fontSize: "13px", maxWidth: "400px" }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          title: log.message,
                        }}
                      >
                        {log.message}
                      </div>
                    </td>
                    <td>
                      {log.details && (
                        <button
                          className="glass"
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          <FileText size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {logs.length > 0 && (
        <section className="card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Showing {logs.length} recent logs
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="glass"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Load More
              </button>
              <button
                className="glass"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Auto Refresh
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
