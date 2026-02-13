import type { BusJob } from "../internal_bus/types.js";
import type { AgentContext, AgentHandleResult } from "./types.js";
import { fetchCoinGeckoPrices, normalizeCoinGeckoData } from "../data_harvester/index.js";
import { aggregateResults, formatForDelivery } from "./result_aggregator.js";
import {
  startAgent,
  completeAgent,
  failAgent,
  getAgentsForParentJob,
  areAllAgentsComplete,
  getAgentResults,
  cleanupAgents,
} from "./spawn_manager.js";
import { spawnTask, createAgentJobs, buildTaskRequest } from "./task_spawner.js";

export const MASTER_COORDINATOR_ID = "master_coordinator";

/**
 * Master Coordinator - orchestrates multi-agent workflows
 * Rule 3: Spawns specialized agents and aggregates results
 */
export async function handle(ctx: AgentContext): Promise<AgentHandleResult> {
  const { job } = ctx;

  try {
    // Step 1: Parse the user request from job payload
    const userQuery = job.payload.query as string;
    const userId = job.payload.userId as string;

    if (!userQuery) {
      return { jobId: job.id, status: "error", error: "No query provided" };
    }

    // Step 2: Build task request and spawn specialized agents
    const taskRequest = buildTaskRequest(userId, userQuery);
    const spawnedJob = spawnTask(taskRequest);
    const agentJobs = createAgentJobs(spawnedJob.jobId, taskRequest);

    // Step 3: Start all agents
    for (const agentJob of agentJobs) {
      await startAgent(agentJob);
    }

    // Step 4: Execute agent logic based on type
    for (const agentJob of agentJobs) {
      await executeAgentTask(agentJob);
    }

    // Step 5: Wait for completion and aggregate results
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (attempts < maxAttempts) {
      if (areAllAgentsComplete(spawnedJob.jobId)) {
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
    }

    // Step 6: Aggregate results
    const results = getAgentResults(spawnedJob.jobId);
    const aggregated = aggregateResults(results);
    const formatted = formatForDelivery(aggregated);

    // Cleanup old agents
    cleanupAgents();

    return {
      jobId: job.id,
      status: "ok",
      output: {
        response: formatted,
        confidence: aggregated.confidence,
        sources: aggregated.sources,
        data: aggregated.data,
      },
    };
  } catch (error) {
    return {
      jobId: job.id,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute agent-specific task based on agent type
 */
async function executeAgentTask(job: BusJob): Promise<void> {
  const agentId = job.assignedAgentId;

  try {
    let result: unknown;

    switch (agentId) {
      case "price_fetcher":
      case "volume_scanner":
        result = await fetchPriceData(job.payload.symbol as string);
        break;

      case "news_collector":
        result = await fetchNewsData(job.payload.query as string);
        break;

      case "sentiment_analyzer":
        result = await analyzeSentiment(job.payload.text as string);
        break;

      case "whale_tracker":
        result = await checkWhaleActivity(job.payload.symbol as string);
        break;

      default:
        // Generic coordinator response
        result = {
          source: agentId,
          message: "Agent task completed",
          timestamp: new Date().toISOString(),
        };
    }

    completeAgent(job.id, result);
  } catch (error) {
    failAgent(job.id, error instanceof Error ? error.message : "Task failed");
  }
}

/**
 * Fetch price data using data harvester
 */
async function fetchPriceData(symbol?: string): Promise<unknown> {
  try {
    const prices = await fetchCoinGeckoPrices(10);
    if (prices) {
      const normalized = normalizeCoinGeckoData(prices);
      return {
        source: "coingecko",
        prices: normalized.map((p) => ({
          symbol: p.symbol,
          price: p.value as number,
          change24h: p.changePercent24h,
        })),
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Fall through to mock data
  }

  // Mock data fallback
  return {
    source: "mock",
    prices: [
      { symbol: "BTC", price: 45000 + Math.random() * 1000, change24h: 2.5 },
      { symbol: "ETH", price: 3000 + Math.random() * 100, change24h: -1.2 },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch news data (mock implementation)
 */
async function fetchNewsData(query: string): Promise<unknown> {
  return {
    source: "news_collector",
    query,
    headlines: [
      "Bitcoin reaches new monthly high",
      "Ethereum layer 2 adoption accelerates",
      "Regulatory clarity improves in major markets",
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Analyze sentiment (mock implementation)
 */
async function analyzeSentiment(text?: string): Promise<unknown> {
  return {
    source: "sentiment_analyzer",
    text,
    sentiment: "positive",
    score: 0.35,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check whale activity (mock implementation)
 */
async function checkWhaleActivity(symbol?: string): Promise<unknown> {
  return {
    source: "whale_tracker",
    symbol,
    largeTransfers: [
      { amount: 500, from: "wallet_a", to: "wallet_b", timestamp: new Date().toISOString() },
    ],
    alert: symbol === "BTC" || symbol === "ETH",
    timestamp: new Date().toISOString(),
  };
}
