import { Users, DollarSign, ArrowUpRight } from "lucide-react";
import { getReferrals } from "@/actions/referrals";

export default async function ReferralsPage() {
  const data = await getReferrals();

  if (!data) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-light)" }}>
          Failed to fetch referral data. Check environment variables.
        </p>
      </div>
    );
  }

  const { referrals, total } = data;
  const paidReferrals = referrals.filter((r) => r.status === "paid").length;
  const totalEarned = referrals.reduce(
    (acc, r) => acc + (r.status === "paid" ? r.referrer_credit : 0),
    0,
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Referral Program</h1>
          <p className="page-subtitle">Manage and track user referral performance</p>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Referrals</span>
            <div
              className="metric-icon"
              style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}
            >
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{total}</div>
          <div className="metric-trend up">
            <ArrowUpRight size={14} />
            <span>Lifetime</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Converted (Paid)</span>
            <div
              className="metric-icon"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}
            >
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="metric-value">{paidReferrals}</div>
          <div className="metric-trend up">
            <span>{total > 0 ? Math.round((paidReferrals / total) * 100) : 0}% Conversion</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Payouts</span>
            <div
              className="metric-icon"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}
            >
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">${totalEarned.toFixed(2)}</div>
          <div className="metric-trend">
            <span>Aggregated Credit</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Recent Referrals</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Referrer ID</th>
                <th>Referred ID</th>
                <th>Status</th>
                <th>Credit (Ref)</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id}>
                  <td>
                    <code style={{ fontSize: "12px" }}>{referral.referrer_id.slice(0, 8)}...</code>
                  </td>
                  <td>
                    <code style={{ fontSize: "12px" }}>{referral.referred_id.slice(0, 8)}...</code>
                  </td>
                  <td>
                    <span className={`status-badge ${referral.status}`}>{referral.status}</span>
                  </td>
                  <td>${referral.referrer_credit.toFixed(2)}</td>
                  <td style={{ color: "var(--text-light)" }}>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: "40px", color: "var(--text-light)" }}
                  >
                    No referrals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
