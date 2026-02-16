"use client";

import { GitBranch, ToggleLeft, ToggleRight, Save, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Header, Message, Card, Grid, StatCard, Button } from "@/components/ui";

interface Flag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const DEFAULT_FLAGS: Flag[] = [
  {
    key: "v1_conversation",
    name: "V1 Conversation",
    description: "AI-powered conversation processing",
    enabled: true,
    category: "AI",
  },
  {
    key: "v1_portfolio",
    name: "V1 Portfolio",
    description: "Portfolio tracking features",
    enabled: true,
    category: "Trading",
  },
  {
    key: "v1_alerts",
    name: "V1 Alerts",
    description: "Price alerts and notifications",
    enabled: true,
    category: "Trading",
  },
  {
    key: "v1_radar",
    name: "V1 Radar",
    description: "Market trend detection",
    enabled: true,
    category: "Analytics",
  },
  {
    key: "live_prices",
    name: "Live Prices",
    description: "Real-time crypto price updates",
    enabled: true,
    category: "Data",
  },
  {
    key: "beta_mode",
    name: "Beta Mode",
    description: "Beta testing features",
    enabled: false,
    category: "Testing",
  },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>(DEFAULT_FLAGS);
  const [message, setMessage] = useState("");

  const toggle = (key: string) => {
    setFlags((f) =>
      f.map((flag) => (flag.key === key ? { ...flag, enabled: !flag.enabled } : flag)),
    );
    setMessage(`Toggled ${key}`);
  };

  const enableAll = () => {
    setFlags((f) => f.map((flag) => ({ ...flag, enabled: true })));
    setMessage("All features enabled");
  };

  const disableAll = () => {
    setFlags((f) => f.map((flag) => ({ ...flag, enabled: false })));
    setMessage("All features disabled");
  };

  const enabled = flags.filter((f) => f.enabled).length;
  const categories = Array.from(new Set(flags.map((f) => f.category)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Header title="Feature Flags" icon={GitBranch} description="Toggle V1 features on/off" />
      <Message message={message} />

      <Grid cols={4}>
        <StatCard value={enabled} label="Enabled" color="#22c55e" />
        <StatCard value={flags.length - enabled} label="Disabled" />
        <StatCard value={flags.length} label="Total" />
        <StatCard value={categories.length} label="Categories" color="#3b82f6" />
      </Grid>

      {categories.map((cat) => (
        <Card key={cat} title={cat}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {flags
              .filter((f) => f.category === cat)
              .map((flag) => (
                <div
                  key={flag.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "var(--bg-soft)",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 600 }}>{flag.name}</span>
                      {flag.enabled ? (
                        <ToggleRight size={20} color="#22c55e" />
                      ) : (
                        <ToggleLeft size={20} color="#6b7280" />
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                      {flag.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => toggle(flag.key)}
                    variant={flag.enabled ? "success" : "default"}
                    size="sm"
                  >
                    {flag.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      ))}

      <Card title="Actions">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Button onClick={() => setMessage("Saved")} icon={Save}>
            Save
          </Button>
          <Button
            onClick={() => {
              setFlags(DEFAULT_FLAGS);
              setMessage("Reloaded");
            }}
            icon={RefreshCw}
          >
            Reload
          </Button>
          <Button onClick={enableAll} icon={GitBranch} variant="success">
            Enable All
          </Button>
          <Button onClick={disableAll} icon={ToggleLeft} variant="danger">
            Disable All
          </Button>
        </div>
      </Card>
    </div>
  );
}
