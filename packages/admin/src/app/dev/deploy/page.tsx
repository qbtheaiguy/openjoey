import { Rocket, GitBranch, Activity, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Deploy Status | OpenJoey Admin",
  description: "View deployment history and status",
};

// Simulated deployment data - in real implementation, this would come from CI/CD
const DEPLOYMENT_HISTORY = [
  {
    id: "deploy-2026-02-15-06-54",
    version: "v1.0.0",
    status: "success",
    timestamp: "2026-02-15T06:54:00Z",
    duration: "3m 24s",
    commit: "a7b2c3d",
    author: "OpenJoey CI",
    environment: "production",
    services: 8,
    description: "Initial V1 deployment with all services",
  },
  {
    id: "deploy-2026-02-15-06-30",
    version: "v1.0.1",
    status: "success",
    timestamp: "2026-02-15T06:30:00Z",
    duration: "2m 15s",
    commit: "d4e5f6g",
    author: "OpenJoey CI",
    environment: "production",
    services: 8,
    description: "Fixed alert service startup issue",
  },
  {
    id: "deploy-2026-02-14-22-15",
    version: "v0.9.8",
    status: "failed",
    timestamp: "2026-02-14T22:15:00Z",
    duration: "5m 42s",
    commit: "h7i8j9k",
    author: "Manual Deploy",
    environment: "staging",
    services: 7,
    description: "Database connection timeout",
    error: "Failed to connect to Supabase: Connection timeout",
  },
];

export default async function DeployStatusPage() {
  const latestDeploy = DEPLOYMENT_HISTORY[0];
  const successCount = DEPLOYMENT_HISTORY.filter((d) => d.status === "success").length;
  const failedCount = DEPLOYMENT_HISTORY.filter((d) => d.status === "failed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2
          style={{
            fontSize: "32px",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Rocket size={32} />
          Deploy Status
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Monitor OpenJoey deployments and service status
        </p>
      </header>

      {/* Current Status */}
      <section className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Current Deployment</h3>
        <div
          style={{
            padding: "20px",
            backgroundColor: latestDeploy.status === "success" ? "#22c55e10" : "#ef444410",
            borderRadius: "8px",
            border: `1px solid ${latestDeploy.status === "success" ? "#22c55e30" : "#ef444430"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "12px",
            }}
          >
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}
              >
                {latestDeploy.status === "success" ? (
                  <CheckCircle size={20} style={{ color: "#22c55e" }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: "#ef4444" }} />
                )}
                <h4 style={{ fontSize: "18px", margin: 0 }}>
                  {latestDeploy.version} - {latestDeploy.environment}
                </h4>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                {latestDeploy.description}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                {new Date(latestDeploy.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{latestDeploy.duration}</div>
            </div>
          </div>

          <div
            style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-muted)" }}
          >
            <span>Commit: {latestDeploy.commit}</span>
            <span>Services: {latestDeploy.services}/8</span>
            <span>Author: {latestDeploy.author}</span>
          </div>

          {latestDeploy.error && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                backgroundColor: "#ef444420",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#991b1b",
                fontFamily: "monospace",
              }}
            >
              Error: {latestDeploy.error}
            </div>
          )}
        </div>
      </section>

      {/* Deployment Stats */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#22c55e" }}>
            {successCount}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Successful</div>
        </div>
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#ef4444" }}>
            {failedCount}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Failed</div>
        </div>
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>v1.0.1</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Latest Version</div>
        </div>
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#3b82f6" }}>
            Hetzner
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Platform</div>
        </div>
      </section>

      {/* Service Status */}
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
          <Activity size={20} />
          Service Status
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            { name: "indicator_engine", port: 3001, status: "running" },
            { name: "signal_engine", port: 3002, status: "running" },
            { name: "conversation_engine", port: 3003, status: "running" },
            { name: "sentiment_service", port: 3004, status: "running" },
            { name: "radar_service", port: 3005, status: "running" },
            { name: "portfolio_service", port: 3006, status: "running" },
            { name: "whale_service", port: 3007, status: "running" },
            { name: "alert_service", port: 3008, status: "running" },
          ].map((service) => (
            <div
              key={service.name}
              style={{
                padding: "12px",
                backgroundColor: "#22c55e10",
                borderRadius: "6px",
                border: "1px solid #22c55e30",
                fontSize: "13px",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>{service.name}</span>
                <span style={{ color: "#22c55e" }}>● {service.status}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Port {service.port}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deployment History */}
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
          <Clock size={20} />
          Deployment History
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {DEPLOYMENT_HISTORY.map((deploy) => (
            <div
              key={deploy.id}
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-soft)",
                borderRadius: "8px",
                border: `1px solid ${deploy.status === "success" ? "#22c55e30" : "#ef444430"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {deploy.status === "success" ? (
                      <CheckCircle size={16} style={{ color: "#22c55e" }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: "#ef4444" }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{deploy.version}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor:
                          deploy.environment === "production" ? "#3b82f620" : "#f59e0b20",
                        color: deploy.environment === "production" ? "#3b82f6" : "#f59e0b",
                      }}
                    >
                      {deploy.environment}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                    {deploy.description}
                  </p>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-muted)" }}>
                  <div>{new Date(deploy.timestamp).toLocaleString()}</div>
                  <div>{deploy.duration}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <span>Commit: {deploy.commit}</span>
                <span>Services: {deploy.services}/8</span>
                <span>Author: {deploy.author}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
            <Rocket size={14} />
            Deploy Latest
          </button>
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
            <GitBranch size={14} />
            Rollback
          </button>
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
            <Activity size={14} />
            Restart Services
          </button>
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
            <Clock size={14} />
            View Logs
          </button>
        </div>
      </section>
    </div>
  );
}
