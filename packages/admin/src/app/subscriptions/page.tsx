import { getSubscriptions } from "@/actions/subscriptions";

export default async function SubscriptionsPage() {
  const data = await getSubscriptions();

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading subscriptions. Check Supabase connection.
        </h2>
      </div>
    );
  }

  const { rows, total } = data;
  const withSub = rows.filter(
    (r) =>
      r.tier !== "free" &&
      r.tier !== "trial" &&
      (r.stripe_subscription_id || r.subscription_ends_at),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Subscriptions</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Live from Supabase. Users: {total}. With subscription/tier: {withSub.length}
        </p>
      </header>
      <section className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Telegram ID</th>
              <th>Username</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Started</th>
              <th>Ends</th>
              <th>Stripe sub ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}
                >
                  No data
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.telegram_id}</td>
                  <td>{u.telegram_username ?? "—"}</td>
                  <td>{u.tier}</td>
                  <td>{u.status}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {u.subscription_started_at
                      ? new Date(u.subscription_started_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {u.subscription_ends_at
                      ? new Date(u.subscription_ends_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td
                    style={{
                      fontSize: "11px",
                      maxWidth: "140px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={u.stripe_subscription_id ?? ""}
                  >
                    {u.stripe_subscription_id ?? "—"}
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
