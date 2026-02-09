import { getSettingsStatus } from "@/actions/settings";

export default async function SettingsPage() {
  const status = await getSettingsStatus();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Settings</h2>
        <p style={{ color: "var(--text-muted)" }}>Connection status. No mock data.</p>
      </header>
      <section className="card" style={{ maxWidth: "480px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Data source</h3>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: status.supabaseConnected ? "#22c55e" : "#ef4444",
              }}
            />
            Supabase: {status.supabaseConnected ? "Connected" : "Not connected"}
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: status.usersTable ? "#22c55e" : "#ef4444",
              }}
            />
            users table: {status.usersTable ? "OK" : "Missing or inaccessible"}
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: status.skillUsageTable ? "#22c55e" : "#ef4444",
              }}
            />
            skill_usage table: {status.skillUsageTable ? "OK" : "Missing or inaccessible"}
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: status.referralsTable ? "#22c55e" : "#ef4444",
              }}
            />
            referrals table: {status.referralsTable ? "OK" : "Missing or inaccessible"}
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: status.referralLeaderboardView ? "#22c55e" : "#ef4444",
              }}
            />
            referral_leaderboard view:{" "}
            {status.referralLeaderboardView ? "OK" : "Missing or inaccessible"}
          </li>
        </ul>
        {status.errorMessage && (
          <p style={{ marginTop: "16px", fontSize: "13px", color: "#b91c1c" }}>
            {status.errorMessage}
          </p>
        )}
        <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
          Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (local) or Vercel env
          (production).
        </p>
      </section>
    </div>
  );
}
