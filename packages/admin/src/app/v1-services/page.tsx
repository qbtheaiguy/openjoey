import {
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { getV1ServiceHealth } from "@/actions/v1-services";

export const metadata = {
  title: "V1 Services | OpenJoey Admin",
  description: "Monitor OpenJoey V1 microservices health and status",
};

const SERVICE_STATUS = {
  healthy: { color: "#22c55e", icon: CheckCircle, label: "Healthy" },
  warning: { color: "#f59e0b", icon: AlertTriangle, label: "Warning" },
  critical: { color: "#ef4444", icon: XCircle, label: "Critical" },
  unknown: { color: "#6b7280", icon: Activity, label: "Unknown" },
};

export default async function V1ServicesPage() {
  const services = await getV1ServiceHealth();

  if (!services) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-muted)" }}>
          Error loading V1 services. Check Hetzner connection.
        </h2>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>V1 Services</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Real-time health status of OpenJoey V1 microservices on Hetzner
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {services.map((service) => {
          const status = SERVICE_STATUS[service.status] || SERVICE_STATUS.unknown;
          const StatusIcon = status.icon;

          return (
            <div
              key={service.port}
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Server size={20} />
                    {service.name}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    Port {service.port} • {service.host}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    backgroundColor: `${status.color}20`,
                    border: `1px solid ${status.color}40`,
                  }}
                >
                  <StatusIcon size={16} style={{ color: status.color }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: status.color }}>
                    {status.label}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Response Time:</span>
                  <span>{service.responseTime}ms</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Last Check:</span>
                  <span>{new Date(service.lastCheck).toLocaleTimeString()}</span>
                </div>
                {service.error && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      marginTop: "8px",
                      padding: "8px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "6px",
                    }}
                  >
                    {service.error}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                <button
                  className="glass"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <button
                  className="glass"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Terminal size={14} />
                  Logs
                </button>
              </div>
            </div>
          );
        })}
      </section>

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
          Service Summary
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
          }}
        >
          {Object.entries(SERVICE_STATUS).map(([key, status]) => {
            const count = services.filter((s) => s.status === key).length;
            const StatusIcon = status.icon;

            return (
              <div
                key={key}
                style={{
                  textAlign: "center",
                  padding: "16px",
                  backgroundColor: "var(--bg-soft)",
                  borderRadius: "8px",
                }}
              >
                <StatusIcon size={24} style={{ color: status.color, marginBottom: "8px" }} />
                <div style={{ fontSize: "24px", fontWeight: 700, color: status.color }}>
                  {count}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{status.label}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
