/**
 * On-Chain Sensor - Scrapes blockchain data for crypto assets
 * Supports: Solana (primary), Ethereum
 */

import { OnChainData, WhaleData, Holder, Transaction } from "../types/index.js";
import { fetchWithRetry } from "../utils/scraper.js";

export class OnChainSensor {
  async getOnChainData(
    tokenAddress: string,
    chain: "solana" | "ethereum" = "solana",
  ): Promise<OnChainData | null> {
    if (chain === "solana") {
      return this.getSolanaData(tokenAddress);
    } else {
      return this.getEthereumData(tokenAddress);
    }
  }

  async getWhaleActivity(
    tokenAddress: string,
    chain: "solana" | "ethereum" = "solana",
  ): Promise<WhaleData | null> {
    if (chain === "solana") {
      return this.getSolanaWhaleData(tokenAddress);
    } else {
      return this.getEthereumWhaleData(tokenAddress);
    }
  }

  /**
   * Get Solana token data from Solscan
   */
  private async getSolanaData(tokenAddress: string): Promise<OnChainData | null> {
    // Get token holders
    const holdersResult = await fetchWithRetry<{
      data?: Array<{
        owner?: string;
        amount?: string;
        decimals?: number;
      }>;
    }>(`https://public-api.solscan.io/token/holders?tokenAddress=${tokenAddress}&limit=50`, {
      parser: "json",
    });

    if (!holdersResult.success || !holdersResult.data?.data) {
      return null;
    }

    const holders = holdersResult.data.data;
    const totalSupply = holders.reduce(
      (sum, h) => sum + parseFloat(h.amount || "0") / Math.pow(10, h.decimals || 0),
      0,
    );

    const topHolders: Holder[] = holders.slice(0, 10).map((h) => {
      const amount = parseFloat(h.amount || "0") / Math.pow(10, h.decimals || 6);
      return {
        address: h.owner || "",
        balance: amount,
        percentage: totalSupply > 0 ? (amount / totalSupply) * 100 : 0,
      };
    });

    // Calculate concentration (top 10 holders)
    const concentration = topHolders.reduce((sum, h) => sum + h.percentage, 0) / 100;

    // Get recent transactions
    const txResult = await fetchWithRetry<{
      data?: Array<{
        signature?: string;
        from?: string;
        to?: string;
        amount?: string;
        decimals?: number;
        blockTime?: number;
      }>;
    }>(`https://public-api.solscan.io/token/transactions?tokenAddress=${tokenAddress}&limit=20`, {
      parser: "json",
    });

    const transactions: Transaction[] =
      txResult.data?.data?.map((tx) => ({
        hash: tx.signature || "",
        from: tx.from || "",
        to: tx.to || "",
        amount: parseFloat(tx.amount || "0") / Math.pow(10, tx.decimals || 6),
        valueUsd: 0, // Would need price lookup
        timestamp: new Date((tx.blockTime || 0) * 1000),
        type: "transfer",
      })) || [];

    return {
      tokenAddress,
      holderCount: holders.length,
      topHolders,
      holderConcentration: concentration,
      recentTransactions: transactions,
      contractVerified: true, // Solscan only lists verified tokens
    };
  }

  /**
   * Get Solana whale data
   */
  private async getSolanaWhaleData(tokenAddress: string): Promise<WhaleData | null> {
    // Get large transactions
    const txResult = await fetchWithRetry<{
      data?: Array<{
        signature?: string;
        from?: string;
        to?: string;
        amount?: string;
        decimals?: number;
        blockTime?: number;
        price?: number;
      }>;
    }>(`https://public-api.solscan.io/token/transactions?tokenAddress=${tokenAddress}&limit=100`, {
      parser: "json",
    });

    if (!txResult.success || !txResult.data?.data) {
      return null;
    }

    const transactions = txResult.data.data;
    const whaleThreshold = 10000; // $10k USD

    // Filter large transactions
    const largeTxs: Transaction[] = [];
    const whaleMovements: {
      address: string;
      amount: number;
      direction: "in" | "out";
      timestamp: Date;
    }[] = [];

    let netFlow24h = 0;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount || "0") / Math.pow(10, tx.decimals || 6);
      const valueUsd = amount * (tx.price || 0);

      if (valueUsd >= whaleThreshold) {
        largeTxs.push({
          hash: tx.signature || "",
          from: tx.from || "",
          to: tx.to || "",
          amount,
          valueUsd,
          timestamp: new Date((tx.blockTime || 0) * 1000),
          type: "transfer",
        });

        // Track in 24h window
        const txTime = (tx.blockTime || 0) * 1000;
        if (txTime > oneDayAgo) {
          netFlow24h += valueUsd;
        }
      }
    }

    // Calculate accumulation score
    const accumulationScore =
      netFlow24h > 0 ? Math.min(10, netFlow24h / 100000) : Math.max(-10, netFlow24h / 100000);

    return {
      recentMovements: whaleMovements,
      netFlow24h,
      accumulationScore,
      largeTransactions: largeTxs,
    };
  }

  /**
   * Get Ethereum token data from Etherscan
   */
  private async getEthereumData(tokenAddress: string): Promise<OnChainData | null> {
    // Note: Requires API key for production, using free tier
    const apiKey = process.env.ETHERSCAN_API_KEY || "";

    if (!apiKey) {
      // Fallback to basic scraping without Etherscan
      return null;
    }

    const url = `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=50&apikey=${apiKey}`;

    const result = await fetchWithRetry<{
      result?: Array<{
        TokenHolderAddress?: string;
        TokenHolderQuantity?: string;
      }>;
    }>(url, { parser: "json" });

    if (!result.success || !result.data?.result) {
      return null;
    }

    const holders = result.data.result;

    const topHolders: Holder[] = holders.slice(0, 10).map((h) => ({
      address: h.TokenHolderAddress || "",
      balance: parseFloat(h.TokenHolderQuantity || "0") / 1e18,
      percentage: 0, // Would need total supply
    }));

    return {
      tokenAddress,
      holderCount: holders.length,
      topHolders,
      holderConcentration: 0.5, // Placeholder
      recentTransactions: [],
      contractVerified: true,
    };
  }

  /**
   * Get Ethereum whale data
   */
  private async getEthereumWhaleData(_tokenAddress: string): Promise<WhaleData | null> {
    // Would need Etherscan API key for this
    // Placeholder implementation
    return {
      recentMovements: [],
      netFlow24h: 0,
      accumulationScore: 0,
      largeTransactions: [],
    };
  }

  /**
   * Detect accumulation vs distribution patterns
   */
  detectAccumulation(whaleData: WhaleData): "accumulation" | "distribution" | "neutral" {
    if (whaleData.accumulationScore > 3) return "accumulation";
    if (whaleData.accumulationScore < -3) return "distribution";
    return "neutral";
  }
}
