/**
 * Edge Decay Tracker - Monitors signal half-life in real-time
 * Alerts when edge falls below threshold
 */

import { Signal, EdgeCalculation } from "../types/index.js";

export interface DecayRecord {
  signalId: string;
  asset: string;
  initialEdge: number;
  currentEdge: number;
  initialTime: Date;
  lastUpdate: Date;
  halfLife: number; // Hours
  status: "active" | "decaying" | "expired";
}

export interface DecayAlert {
  signalId: string;
  asset: string;
  alertType: "half_life" | "quarter_life" | "expired";
  remainingEdge: number;
  message: string;
}

export class EdgeDecayTracker {
  private activeEdges: Map<string, DecayRecord> = new Map();
  private alertCallbacks: ((alert: DecayAlert) => void)[] = [];

  /**
   * Register a new signal for tracking
   */
  registerSignal(signal: Signal, edge: EdgeCalculation): void {
    const record: DecayRecord = {
      signalId: signal.id,
      asset: signal.asset,
      initialEdge: edge.expectedValue,
      currentEdge: edge.expectedValue,
      initialTime: new Date(),
      lastUpdate: new Date(),
      halfLife: edge.halfLife,
      status: "active",
    };

    this.activeEdges.set(signal.id, record);
  }

  /**
   * Update all tracked edges (call periodically)
   */
  updateAll(): DecayAlert[] {
    const alerts: DecayAlert[] = [];
    const now = new Date();

    for (const [id, record] of this.activeEdges) {
      if (record.status === "expired") continue;

      const elapsedHours = (now.getTime() - record.initialTime.getTime()) / (1000 * 60 * 60);

      // Calculate current edge using exponential decay
      // Edge(t) = Edge₀ × (0.5)^(t / half_life)
      const decayFactor = Math.pow(0.5, elapsedHours / record.halfLife);
      const currentEdge = record.initialEdge * decayFactor;

      record.currentEdge = currentEdge;
      record.lastUpdate = now;

      // Check for alerts
      const previousEdge =
        (record.currentEdge / decayFactor) * Math.pow(0.5, (elapsedHours - 0.1) / record.halfLife);

      // Half-life reached
      if (elapsedHours >= record.halfLife && elapsedHours < record.halfLife * 1.1) {
        const alert: DecayAlert = {
          signalId: id,
          asset: record.asset,
          alertType: "half_life",
          remainingEdge: currentEdge,
          message: `${record.asset} signal at half-life. Edge decayed to ${currentEdge.toFixed(2)}% (was ${record.initialEdge.toFixed(2)}%)`,
        };
        alerts.push(alert);
        record.status = "decaying";
      }

      // Quarter-life (75% decayed)
      if (elapsedHours >= record.halfLife * 2 && elapsedHours < record.halfLife * 2.1) {
        const alert: DecayAlert = {
          signalId: id,
          asset: record.asset,
          alertType: "quarter_life",
          remainingEdge: currentEdge,
          message: `${record.asset} signal at quarter-life. Edge severely decayed to ${currentEdge.toFixed(2)}%. Consider exiting.`,
        };
        alerts.push(alert);
      }

      // Expired (5 half-lives = ~97% decayed)
      if (elapsedHours >= record.halfLife * 5) {
        const alert: DecayAlert = {
          signalId: id,
          asset: record.asset,
          alertType: "expired",
          remainingEdge: currentEdge,
          message: `${record.asset} signal EXPIRED. Edge effectively zero.`,
        };
        alerts.push(alert);
        record.status = "expired";
      }
    }

    // Trigger callbacks
    for (const alert of alerts) {
      for (const callback of this.alertCallbacks) {
        callback(alert);
      }
    }

    return alerts;
  }

  /**
   * Get current edge for a signal
   */
  getCurrentEdge(signalId: string): number | null {
    const record = this.activeEdges.get(signalId);
    if (!record) return null;

    const elapsedHours = (Date.now() - record.initialTime.getTime()) / (1000 * 60 * 60);
    const decayFactor = Math.pow(0.5, elapsedHours / record.halfLife);
    return record.initialEdge * decayFactor;
  }

  /**
   * Get all active edges
   */
  getActiveEdges(): DecayRecord[] {
    return Array.from(this.activeEdges.values()).filter((r) => r.status !== "expired");
  }

  /**
   * Subscribe to decay alerts
   */
  onAlert(callback: (alert: DecayAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove expired signals
   */
  cleanupExpired(): number {
    let removed = 0;
    for (const [id, record] of this.activeEdges) {
      if (record.status === "expired") {
        this.activeEdges.delete(id);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Generate decay report
   */
  generateReport(): string {
    const active = this.getActiveEdges();

    if (active.length === 0) {
      return "No active edges being tracked.";
    }

    let report = "EDGE DECAY REPORT\n";
    report += "━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    for (const record of active) {
      const elapsedHours = (Date.now() - record.initialTime.getTime()) / (1000 * 60 * 60);
      const percentRemaining = (record.currentEdge / record.initialEdge) * 100;

      report += `${record.asset}\n`;
      report += `  Initial Edge: ${record.initialEdge.toFixed(2)}%\n`;
      report += `  Current Edge: ${record.currentEdge.toFixed(2)}% (${percentRemaining.toFixed(0)}%)\n`;
      report += `  Time Elapsed: ${elapsedHours.toFixed(1)}h / ${record.halfLife}h half-life\n`;
      report += `  Status: ${record.status.toUpperCase()}\n\n`;
    }

    return report;
  }
}
