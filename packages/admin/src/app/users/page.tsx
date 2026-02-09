import { getUsers } from "@/actions/users";

export default async function UsersPage() {
  const data = await getUsers();

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading users. Check Supabase connection.
        </h2>
      </div>
    );
  }

  const { users, total } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Users</h2>
        <p style={{ color: "var(--text-muted)" }}>Live from Supabase. Total: {total}</p>
      </header>
      <section className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Telegram ID</th>
              <th>Username</th>
              <th>Display name</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}
                >
                  No data
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.telegram_id}</td>
                  <td>{u.telegram_username ?? "—"}</td>
                  <td>{u.display_name ?? "—"}</td>
                  <td>{u.tier}</td>
                  <td>{u.status}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {new Date(u.created_at).toLocaleString()}
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
