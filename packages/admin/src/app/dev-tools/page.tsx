import {
  Terminal,
  Code,
  GitBranch,
  Package,
  Rocket,
  TestTube,
  Bug,
  CheckCircle,
} from "lucide-react";
import { getEnvironmentStatus, getDebugActions } from "@/actions/dev-tools";

export const metadata = {
  title: "Dev Tools | OpenJoey Admin",
  description: "Developer tools and utilities for OpenJoey",
};

const DEV_TOOLS = [
  {
    name: "Database Console",
    description: "Run SQL queries directly on Supabase",
    icon: Terminal,
    href: "/dev/database",
    color: "#3b82f6",
  },
  {
    name: "API Explorer",
    description: "Test OpenJoey API endpoints",
    icon: Code,
    href: "/dev/api-explorer",
    color: "#10b981",
  },
  {
    name: "Feature Flags",
    description: "Toggle V1 features on/off",
    icon: GitBranch,
    href: "/dev/feature-flags",
    color: "#f59e0b",
  },
  {
    name: "Cache Manager",
    description: "View and clear Redis caches",
    icon: Package,
    href: "/dev/cache",
    color: "#8b5cf6",
  },
  {
    name: "Deploy Status",
    description: "View deployment history and status",
    icon: Rocket,
    href: "/dev/deploy",
    color: "#ef4444",
  },
  {
    name: "Test Runner",
    description: "Run V1 integration tests",
    icon: TestTube,
    href: "/dev/tests",
    color: "#06b6d4",
  },
];

export default async function DevToolsPage() {
  const [envStatus, debugActions] = await Promise.all([getEnvironmentStatus(), getDebugActions()]);

  const STATUS_COLORS = {
    online: "#22c55e",
    connected: "#22c55e",
    active: "#22c55e",
    healthy: "#22c55e",
    offline: "#ef4444",
    disconnected: "#ef4444",
    inactive: "#ef4444",
    unhealthy: "#ef4444",
    unknown: "#6b7280",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>Developer Tools</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Quick access to development utilities and debugging tools
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {DEV_TOOLS.map((tool) => {
          const Icon = tool.icon;

          return (
            <a
              key={tool.name}
              href={tool.href}
              className="card"
              style={{
                padding: "24px",
                textDecoration: "none",
                color: "var(--text)",
                display: "block",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: `${tool.color}20`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={24} style={{ color: tool.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {tool.name}
                    <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                    {tool.description}
                  </p>
                </div>
              </div>
            </a>
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
          <Bug size={20} />
          Quick Debug Actions
        </h3>
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
            <Terminal size={14} />
            Clear All Caches
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
            <Package size={14} />
            Reset Database
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
            <TestTube size={14} />
            Run Health Check
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Environment Status</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Hetzner Server
            </div>
            <div
              style={{ fontSize: "14px", fontWeight: 600, color: STATUS_COLORS[envStatus.hetzner] }}
            >
              ● {envStatus.hetzner.charAt(0).toUpperCase() + envStatus.hetzner.slice(1)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Supabase DB
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: STATUS_COLORS[envStatus.supabase],
              }}
            >
              ● {envStatus.supabase.charAt(0).toUpperCase() + envStatus.supabase.slice(1)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Kimi API
            </div>
            <div
              style={{ fontSize: "14px", fontWeight: 600, color: STATUS_COLORS[envStatus.kimiApi] }}
            >
              ● {envStatus.kimiApi.charAt(0).toUpperCase() + envStatus.kimiApi.slice(1)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              CoinGecko API
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: STATUS_COLORS[envStatus.coingeckoApi],
              }}
            >
              ● {envStatus.coingeckoApi.charAt(0).toUpperCase() + envStatus.coingeckoApi.slice(1)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
