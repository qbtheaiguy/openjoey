import { getTierPolicies } from "@/actions/policies";

export default async function PoliciesPage() {
  const data = await getTierPolicies();

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading tier policies. Check Supabase (skill_catalog table).
        </h2>
      </div>
    );
  }

  const { policies } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Tier Policies</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Live from Supabase skill_catalog. Which tiers can use which skills.
        </p>
      </header>
      <section className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Skill ID</th>
              <th>Display name</th>
              <th>Category</th>
              <th>Cost tier</th>
              <th>Allowed tiers</th>
              <th>Blocked tiers</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}
                >
                  No data
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.id}</td>
                  <td>{p.display_name}</td>
                  <td>{p.category ?? "—"}</td>
                  <td>{p.cost_tier ?? "—"}</td>
                  <td style={{ fontSize: "12px" }}>{(p.allowed_tiers ?? []).join(", ") || "—"}</td>
                  <td style={{ fontSize: "12px" }}>{(p.blocked_tiers ?? []).join(", ") || "—"}</td>
                  <td>{p.is_active ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
