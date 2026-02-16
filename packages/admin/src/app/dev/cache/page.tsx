"use client";

import { Package, Database, Trash2, RefreshCw, Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface CacheEntry {
  key: string;
  type: string;
  size: string;
  ttl: string;
  entries: number;
  description: string;
}

export default function CacheManagerPage() {
  const [cacheData, setCacheData] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [metrics, setMetrics] = useState({
    hitRate: "87.3%",
    missRate: "12.7%",
    avgResponse: "2.3ms",
    connected: false,
  });

  // Fetch cache data
  const fetchCacheData = async () => {
    setLoading(true);
    setMessage("Fetching cache data...");

    try {
      const response = await fetch("/api/cache/stats");
      if (response.ok) {
        const data = await response.json();
        setCacheData(data.caches || []);
        setMetrics(data.metrics || metrics);
        setMessage(`Found ${data.caches?.length || 0} cache entries`);
      } else {
        setMessage("Failed to fetch cache data");
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Execute cache action
  const executeAction = async (action: string, key?: string) => {
    setLoading(true);
    setMessage(`Executing: ${action}...`);

    try {
      const response = await fetch("/api/cache/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, key }),
      });

      const result = await response.json();
      setMessage(result.message);

      // Refresh data after action
      if (result.success) {
        await fetchCacheData();
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchCacheData();
  }, []);

  const totalSize = cacheData.reduce((sum, cache) => {
    const size = parseFloat(cache.size.replace(/[^\d.]/g, ""));
    const unit = cache.size.includes("MB") ? 1024 : 1;
    return sum + size * unit;
  }, 0);

  const totalEntries = cacheData.reduce((sum, cache) => sum + cache.entries, 0);

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
          <Package size={32} />
          Cache Manager
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Monitor and manage Redis caches for OpenJoey services
        </p>
      </header>

      {/* Cache Overview */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
            {(totalSize / 1024).toFixed(1)}MB
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Total Size</div>
        </div>
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
            {totalEntries}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Total Entries</div>
        </div>
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#22c55e" }}>
            {cacheData.length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Cache Types</div>
        </div>
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "8px",
              color: metrics.connected ? "#22c55e" : "#ef4444",
            }}
          >
            {metrics.connected ? "Connected" : "Redis"}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Status</div>
        </div>
      </section>

      {/* Message */}
      {message && (
        <section
          className="card"
          style={{ padding: "16px", backgroundColor: "#3b82f610", border: "1px solid #3b82f630" }}
        >
          <div style={{ fontSize: "13px", color: "#3b82f6" }}>{message}</div>
        </section>
      )}

      {/* Cache Actions */}
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
          Cache Actions
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
            onClick={() => fetchCacheData()}
          >
            <RefreshCw size={14} />
            Refresh All Caches
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
              backgroundColor: "#f59e0b20",
              color: "#f59e0b",
            }}
            onClick={() => executeAction("clear-expired")}
          >
            <Trash2 size={14} />
            Clear Expired
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
              backgroundColor: "#ef444420",
              color: "#ef4444",
            }}
            onClick={() => executeAction("clear-all")}
          >
            <Trash2 size={14} />
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
            onClick={() => executeAction("optimize")}
          >
            <Database size={14} />
            Optimize Memory
          </button>
        </div>
      </section>
    </div>
  );
}
