/**
 * OpenJoey Portfolio Service - Portfolio Management & Analysis
 * Manages: portfolios, portfolio_assets, risk analysis
 */

import { getOpenJoeyDB } from "../../supabase-client.js";

export interface Portfolio {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface PortfolioAsset {
  id?: string;
  portfolio_id: string;
  asset_symbol: string;
  amount: number;
  avg_entry_price: number;
  current_price?: number;
  unrealized_pnl?: number;
  allocation_percentage?: number;
}

export interface PortfolioAnalysis {
  total_value: number;
  total_cost: number;
  total_pnl: number;
  pnl_percentage: number;
  risk_score: number; // 0-100
  diversification_score: number; // 0-100
  top_performer?: string;
  worst_performer?: string;
}

/**
 * Create a new portfolio for user
 */
export async function createPortfolio(
  userId: string,
  name: string,
  description?: string,
): Promise<Portfolio | null> {
  try {
    const db = getOpenJoeyDB();

    const portfolio = await db.insert("portfolios", {
      user_id: userId,
      name: name,
      description: description || null,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    return portfolio as Portfolio;
  } catch (error) {
    console.error("Error creating portfolio:", error);
    return null;
  }
}

/**
 * Get user's portfolios
 */
export async function getUserPortfolios(userId: string): Promise<Portfolio[]> {
  try {
    const db = getOpenJoeyDB();
    const portfolios = await db.get("portfolios", `user_id=eq.${userId}&is_active=eq.true`);

    return (portfolios || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      description: p.description,
      is_active: p.is_active,
      created_at: p.created_at,
    }));
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return [];
  }
}

/**
 * Add asset to portfolio
 */
export async function addPortfolioAsset(
  portfolioId: string,
  symbol: string,
  amount: number,
  entryPrice: number,
): Promise<PortfolioAsset | null> {
  try {
    const db = getOpenJoeyDB();

    // Check if asset already exists
    const existing = await db.get(
      "portfolio_assets",
      `portfolio_id=eq.${portfolioId}&asset_symbol=eq.${symbol}`,
    );

    if (existing && existing.length > 0) {
      // Update existing position
      const current = existing[0] as any;
      const newAmount = current.amount + amount;
      const newAvgPrice =
        (current.amount * current.avg_entry_price + amount * entryPrice) / newAmount;

      const updated = await db.update("portfolio_assets", `id=eq.${current.id}`, {
        amount: newAmount,
        avg_entry_price: newAvgPrice,
        updated_at: new Date().toISOString(),
      });

      return updated as unknown as PortfolioAsset;
    }

    // Create new position
    const asset = await db.insert("portfolio_assets", {
      portfolio_id: portfolioId,
      asset_symbol: symbol,
      amount: amount,
      avg_entry_price: entryPrice,
      created_at: new Date().toISOString(),
    });

    return asset as PortfolioAsset;
  } catch (error) {
    console.error("Error adding portfolio asset:", error);
    return null;
  }
}

/**
 * Remove asset from portfolio
 */
export async function removePortfolioAsset(
  portfolioId: string,
  symbol: string,
  amount?: number, // if not provided, removes all
): Promise<boolean> {
  try {
    const db = getOpenJoeyDB();

    const existing = await db.get(
      "portfolio_assets",
      `portfolio_id=eq.${portfolioId}&asset_symbol=eq.${symbol}`,
    );

    if (!existing || existing.length === 0) {
      return false;
    }

    const current = existing[0] as any;

    if (amount && amount < current.amount) {
      // Partial removal
      await db.update("portfolio_assets", `id=eq.${(current as any).id}`, {
        amount: (current as any).amount - amount,
        updated_at: new Date().toISOString(),
      });
    } else {
      // Full removal
      await db.delete("portfolio_assets", `id=eq.${(current as any).id}`);
    }

    return true;
  } catch (error) {
    console.error("Error removing portfolio asset:", error);
    return false;
  }
}

/**
 * Get portfolio assets
 */
export async function getPortfolioAssets(portfolioId: string): Promise<PortfolioAsset[]> {
  try {
    const db = getOpenJoeyDB();
    const assets = await db.get("portfolio_assets", `portfolio_id=eq.${portfolioId}`);

    return (assets || []).map((a: any) => ({
      id: a.id,
      portfolio_id: a.portfolio_id,
      asset_symbol: a.asset_symbol,
      amount: a.amount,
      avg_entry_price: a.avg_entry_price,
      current_price: a.current_price,
      unrealized_pnl: a.unrealized_pnl,
    }));
  } catch (error) {
    console.error("Error fetching portfolio assets:", error);
    return [];
  }
}

/**
 * Analyze portfolio performance and risk
 */
export async function analyzePortfolio(portfolioId: string): Promise<PortfolioAnalysis | null> {
  try {
    const assets = await getPortfolioAssets(portfolioId);

    if (assets.length === 0) {
      return null;
    }

    let totalValue = 0;
    let totalCost = 0;
    let topPerformer = "";
    let worstPerformer = "";
    let bestReturn = -Infinity;
    let worstReturn = Infinity;

    // Calculate metrics (using mock current prices for now)
    for (const asset of assets) {
      // Mock current price (in production: fetch from price service)
      const currentPrice = asset.avg_entry_price * (1 + (Math.random() * 0.4 - 0.2));

      const value = asset.amount * currentPrice;
      const cost = asset.amount * asset.avg_entry_price;
      const pnl = value - cost;
      const pnlPct = (pnl / cost) * 100;

      totalValue += value;
      totalCost += cost;

      if (pnlPct > bestReturn) {
        bestReturn = pnlPct;
        topPerformer = asset.asset_symbol;
      }

      if (pnlPct < worstReturn) {
        worstReturn = pnlPct;
        worstPerformer = asset.asset_symbol;
      }
    }

    const totalPnl = totalValue - totalCost;
    const pnlPercentage = (totalPnl / totalCost) * 100;

    // Calculate risk score (simplified)
    const assetCount = assets.length;
    const concentrationRisk =
      assetCount === 1 ? 80 : assetCount < 3 ? 50 : assetCount < 5 ? 30 : 20;
    const volatilityRisk =
      Math.abs(pnlPercentage) > 20 ? 40 : Math.abs(pnlPercentage) > 10 ? 25 : 15;
    const riskScore = Math.min(100, concentrationRisk + volatilityRisk);

    // Calculate diversification score
    const diversificationScore = Math.min(100, assetCount * 20);

    return {
      total_value: parseFloat(totalValue.toFixed(2)),
      total_cost: parseFloat(totalCost.toFixed(2)),
      total_pnl: parseFloat(totalPnl.toFixed(2)),
      pnl_percentage: parseFloat(pnlPercentage.toFixed(2)),
      risk_score: riskScore,
      diversification_score: diversificationScore,
      top_performer: topPerformer,
      worst_performer: worstPerformer,
    };
  } catch (error) {
    console.error("Error analyzing portfolio:", error);
    return null;
  }
}

/**
 * Get portfolio summary for user
 */
export async function getPortfolioSummary(userId: string): Promise<string> {
  const portfolios = await getUserPortfolios(userId);

  if (portfolios.length === 0) {
    return "No portfolios found. Create one to start tracking your assets!";
  }

  let summary = "";

  for (const portfolio of portfolios) {
    const analysis = await analyzePortfolio(portfolio.id!);
    const assets = await getPortfolioAssets(portfolio.id!);

    summary += `📊 **${portfolio.name}**\n`;

    if (analysis) {
      const pnlEmoji = analysis.total_pnl >= 0 ? "🟢" : "🔴";
      summary += `💰 Value: $${analysis.total_value.toLocaleString()}\n`;
      summary += `${pnlEmoji} P&L: $${analysis.total_pnl.toLocaleString()} (${analysis.pnl_percentage}%)\n`;
      summary += `⚠️ Risk Score: ${analysis.risk_score}/100\n`;
    }

    summary += `📈 Assets: ${assets.length}\n`;
    assets.forEach((asset) => {
      summary += `  • ${asset.asset_symbol}: ${asset.amount}\n`;
    });

    summary += "\n";
  }

  return summary;
}
