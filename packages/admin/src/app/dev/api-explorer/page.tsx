"use client";

import { Code, Play, Globe } from "lucide-react";
import { useState } from "react";
import { Header, Message, Card, Grid, StatCard, Button } from "@/components/ui";
import { useAction } from "@/hooks";

const ENDPOINTS = [
  { name: "V1 Services", url: "http://116.203.215.213:3001/health" },
  { name: "Gateway", url: "http://116.203.215.213:18789/health" },
  { name: "Conversation", url: "http://116.203.215.213:3003/health" },
  { name: "Portfolio", url: "http://116.203.215.213:3006/health" },
  { name: "Alert", url: "http://116.203.215.213:3008/health" },
];

interface Result {
  name: string;
  status: "success" | "error";
  statusCode: number;
  url: string;
  error?: string;
}

export default function ApiExplorerPage() {
  const [results, setResults] = useState<Result[]>([]);
  const { loading, message, execute } = useAction();

  const runTests = async () => {
    await execute(async () => {
      const tests: Result[] = await Promise.all(
        ENDPOINTS.map(async (ep) => {
          try {
            const res = await fetch(ep.url, { signal: AbortSignal.timeout(5000) });
            return {
              ...ep,
              status: res.ok ? ("success" as const) : ("error" as const),
              statusCode: res.status,
            };
          } catch (e) {
            return { ...ep, status: "error" as const, statusCode: 0, error: "Failed" };
          }
        }),
      );
      setResults(tests);
      return { success: true, message: `Tested ${tests.length} endpoints` };
    });
  };

  const success = results.filter((r) => r.status === "success").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Header title="API Explorer" icon={Code} description="Test OpenJoey API endpoints" />
      <Message message={message} />

      <Grid cols={4}>
        <StatCard value={success} label="Healthy" color="#22c55e" />
        <StatCard value={results.length - success} label="Errors" color="#ef4444" />
        <StatCard value={results.length} label="Total" />
        <StatCard value="Hetzner" label="Server" color="#3b82f6" />
      </Grid>

      <Card title="Endpoint Tests" icon={<Globe size={20} />}>
        <Button onClick={runTests} icon={Play} loading={loading}>
          Run All Tests
        </Button>
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {results.map((r) => (
            <div
              key={r.name}
              style={{
                padding: "12px",
                backgroundColor: r.status === "success" ? "#22c55e10" : "#ef444410",
                borderRadius: "6px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{r.name}</span>
                <span style={{ color: r.status === "success" ? "#22c55e" : "#ef4444" }}>
                  {r.statusCode}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.url}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
