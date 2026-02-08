/**
 * Trade Ledger - Stores and tracks all signals and their outcomes
 * Enables performance tracking and pattern learning
 */

import { Signal, TradeSetup, EdgeCalculation } from "../types/index.js";

export interface LedgerEntry {
  id: string;
  timestamp: Date;
  asset: string;
  marketType: string;
  signal: Signal;
  tradeSetup: TradeSetup;
  edge: EdgeCalculation;
  entryPrice?: number;
  exitPrice?: number;
  exitTime?: Date;
  outcome?: "win" | "loss" | "breakeven" | "open";
  return?: number;
  maxDrawdown?: number;
  notes?: string;
}

export interface PerformanceStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export class TradeLedger {
  private entries: LedgerEntry[] = [];
  private storage: StorageBackend;

  constructor(storage: StorageBackend = new MemoryStorage()) {
    this.storage = storage;
  }

  /**
   * Record a new signal/trade in the ledger
   */
  recordSignal(
    signal: Signal,
    tradeSetup: TradeSetup,
    edge: EdgeCalculation,
    marketType: string,
  ): LedgerEntry {
    const entry: LedgerEntry = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      asset: signal.asset,
      marketType,
      signal,
      tradeSetup,
      edge,
      outcome: "open",
    };

    this.entries.push(entry);
    this.save();

    return entry;
  }

  /**
   * Update trade with outcome
   */
  updateOutcome(
    entryId: string,
    outcome: "win" | "loss" | "breakeven",
    exitPrice: number,
    notes?: string,
  ): void {
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) return;

    entry.outcome = outcome;
    entry.exitPrice = exitPrice;
    entry.exitTime = new Date();
    entry.notes = notes;

    // Calculate return
    if (entry.tradeSetup.direction === "long") {
      entry.return =
        ((exitPrice - entry.tradeSetup.entry.optimal) / entry.tradeSetup.entry.optimal) * 100;
    } else {
      entry.return =
        ((entry.tradeSetup.entry.optimal - exitPrice) / entry.tradeSetup.entry.optimal) * 100;
    }

    this.save();
  }

  /**
   * Get performance statistics
   */
  getStats(asset?: string, marketType?: string): PerformanceStats {
    let entries = this.entries.filter((e) => e.outcome && e.outcome !== "open");

    if (asset) {
      entries = entries.filter((e) => e.asset === asset);
    }
    if (marketType) {
      entries = entries.filter((e) => e.marketType === marketType);
    }

    if (entries.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgReturn: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
      };
    }

    const winningTrades = entries.filter((e) => e.outcome === "win");
    const losingTrades = entries.filter((e) => e.outcome === "loss");

    const winRate = winningTrades.length / entries.length;

    const returns = entries.map((e) => e.return || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    const wins = winningTrades.map((e) => e.return || 0);
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;

    const losses = losingTrades.map((e) => Math.abs(e.return || 0));
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    for (const ret of returns) {
      cumulative += ret;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Simplified Sharpe (assume risk-free rate = 0)
    const stdDev = Math.sqrt(
      returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length,
    );
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return {
      totalTrades: entries.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgReturn,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      sharpeRatio,
    };
  }

  /**
   * Get signal type performance
   */
  getSignalTypeStats(): Record<string, { wins: number; losses: number; winRate: number }> {
    const stats: Record<string, { wins: number; losses: number; winRate: number }> = {};

    for (const entry of this.entries) {
      if (!entry.outcome || entry.outcome === "open") continue;

      const type = entry.signal.type;
      if (!stats[type]) {
        stats[type] = { wins: 0, losses: 0, winRate: 0 };
      }

      if (entry.outcome === "win") {
        stats[type].wins++;
      } else if (entry.outcome === "loss") {
        stats[type].losses++;
      }
    }

    // Calculate win rates
    for (const type in stats) {
      const s = stats[type];
      s.winRate = s.wins / (s.wins + s.losses);
    }

    return stats;
  }

  /**
   * Get all entries
   */
  getEntries(filters?: { asset?: string; outcome?: string; limit?: number }): LedgerEntry[] {
    let entries = [...this.entries];

    if (filters?.asset) {
      entries = entries.filter((e) => e.asset === filters.asset);
    }
    if (filters?.outcome) {
      entries = entries.filter((e) => e.outcome === filters.outcome);
    }
    if (filters?.limit) {
      entries = entries.slice(0, filters.limit);
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats();
    const typeStats = this.getSignalTypeStats();

    let report = "TRADE LEDGER REPORT\n";
    report += "━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    report += `Total Trades: ${stats.totalTrades}\n`;
    report += `Win Rate: ${(stats.winRate * 100).toFixed(1)}%\n`;
    report += `Avg Return: ${stats.avgReturn.toFixed(2)}%\n`;
    report += `Profit Factor: ${stats.profitFactor.toFixed(2)}\n`;
    report += `Max Drawdown: ${stats.maxDrawdown.toFixed(2)}%\n\n`;

    report += "Signal Type Performance:\n";
    for (const [type, stat] of Object.entries(typeStats)) {
      report += `  ${type}: ${(stat.winRate * 100).toFixed(0)}% (${stat.wins}W/${stat.losses}L)\n`;
    }

    return report;
  }

  private save(): void {
    this.storage.save(this.entries);
  }

  async load(): Promise<void> {
    this.entries = await this.storage.load();
  }
}

// Storage interface
export interface StorageBackend {
  save(entries: LedgerEntry[]): void;
  load(): Promise<LedgerEntry[]>;
}

// In-memory storage (default)
export class MemoryStorage implements StorageBackend {
  private data: LedgerEntry[] = [];

  save(entries: LedgerEntry[]): void {
    this.data = [...entries];
  }

  async load(): Promise<LedgerEntry[]> {
    return [...this.data];
  }
}

// File-based storage
export class FileStorage implements StorageBackend {
  private filepath: string;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  save(entries: LedgerEntry[]): void {
    // Would use fs in real implementation
    // fs.writeFileSync(this.filepath, JSON.stringify(entries, null, 2));
  }

  async load(): Promise<LedgerEntry[]> {
    // Would use fs in real implementation
    // const data = fs.readFileSync(this.filepath, 'utf8');
    // return JSON.parse(data);
    return [];
  }
}
