import { getSkillLogs } from "@/actions/logs";

export default async function LogsPage() {
  const data = await getSkillLogs(100);

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading skill logs. Check Supabase connection.
        </h2>
      </div>
    );
  }

  const { logs, total } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Skill Logs</h2>
        <p style={{ color: "var(--text-muted)" }}>Live from Supabase. Total: {total}</p>
      </header>
      <section className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User ID</th>
              <th>Skill</th>
              <th>Result</th>
              <th>Duration</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}
                >
                  No data
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td
                    style={{ color: "var(--text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}
                  >
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td
                    style={{
                      fontWeight: 600,
                      fontSize: "12px",
                      maxWidth: "100px",
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
                  <td
                    style={{
                      fontSize: "12px",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={log.error_message ?? ""}
                  >
                    {log.error_message ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
