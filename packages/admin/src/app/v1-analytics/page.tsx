import {
  Database,
  Zap,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { getV1Analytics } from "@/actions/v1-analytics";

export const metadata = {
  title: "V1 Analytics | OpenJoey Admin",
  description: "OpenJoey V1 usage analytics and metrics",
};

export default async function V1AnalyticsPage() {
  const analytics = await getV1Analytics();

  if (!analytics) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading V1 analytics. Check database connection.
        </h2>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>V1 Analytics</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Usage metrics and analytics for OpenJoey V1 features
        </p>
      </header>

      {/* Key Metrics */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ padding: "8px", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
              <Zap size={20} style={{ color: "#1e40af" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Total Queries
              </h3>
              <p style={{ fontSize: "24px", fontWeight: 700 }}>
                {analytics.totalQueries.toLocaleString()}
              </p>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#22c55e" }}>
            ↑ {analytics.queryGrowth}% from last week
          </div>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ padding: "8px", backgroundColor: "#dcfce7", borderRadius: "8px" }}>
              <TrendingUp size={20} style={{ color: "#166534" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Active Users
              </h3>
              <p style={{ fontSize: "24px", fontWeight: 700 }}>
                {analytics.activeUsers.toLocaleString()}
              </p>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#22c55e" }}>
            ↑ {analytics.userGrowth}% from last week
          </div>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ padding: "8px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
              <AlertTriangle size={20} style={{ color: "#92400e" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Error Rate
              </h3>
              <p style={{ fontSize: "24px", fontWeight: 700 }}>{analytics.errorRate}%</p>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: analytics.errorRate > 5 ? "#ef4444" : "#22c55e" }}>
            {analytics.errorRate > 5 ? "↑ Above target" : "↓ Within target"}
          </div>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ padding: "8px", backgroundColor: "#f3e8ff", borderRadius: "8px" }}>
              <Activity size={20} style={{ color: "#6b21a8" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Avg Response
              </h3>
              <p style={{ fontSize: "24px", fontWeight: 700 }}>{analytics.avgResponseTime}ms</p>
            </div>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: analytics.avgResponseTime < 2000 ? "#22c55e" : "#f59e0b",
            }}
          >
            {analytics.avgResponseTime < 2000 ? "✓ Good" : "⚠ Slow"}
          </div>
        </div>
      </section>

      {/* Feature Usage */}
      <section className="card" style={{ padding: "24px" }}>
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <BarChart3 size={20} />
          Feature Usage
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {analytics.featureUsage.map((feature) => (
            <div
              key={feature.name}
              style={{ padding: "16px", backgroundColor: "var(--bg-soft)", borderRadius: "8px" }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
                {feature.name}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>
                {feature.count.toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {feature.percentage}% of total
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Asset Analysis */}
      <section className="card" style={{ padding: "24px" }}>
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <PieChart size={20} />
          Top Analyzed Assets
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
          }}
        >
          {analytics.topAssets.map((asset, index) => (
            <div
              key={asset.symbol}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                backgroundColor: "var(--bg-soft)",
                borderRadius: "6px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                #{index + 1}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{asset.symbol}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {asset.count} queries
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="card" style={{ padding: "24px" }}>
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Database size={20} />
          Performance Metrics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Database Queries
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>
              {analytics.dbQueries.toLocaleString()}/day
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Cache Hit Rate
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>{analytics.cacheHitRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              API Calls
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>
              {analytics.apiCalls.toLocaleString()}/day
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Memory Usage
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>{analytics.memoryUsage}MB</div>
          </div>
        </div>
      </section>
    </div>
  );
}
