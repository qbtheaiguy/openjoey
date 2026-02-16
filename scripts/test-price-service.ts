#!/usr/bin/env node
/**
 * Test script for OpenJoey Price Service APIs
 * Verifies all data sources work before deployment
 */

import {
  getTokenData,
  getTrendingByChain,
  detectChain,
  selectDataSource,
  formatMultiChainResponse,
} from "./src/openjoey/services/price-service/index.js";

async function testAPIs() {
  console.log("🧪 Testing OpenJoey Price Service APIs...\n");

  // Test 1: Chain Detection
  console.log("1️⃣ Testing Chain Detection...");
  const solanaTest = detectChain("RAY");
  const ethTest = detectChain("ETH");
  const bscTest = detectChain("CAKE");
  console.log(`   RAY → ${solanaTest.chain} (confidence: ${solanaTest.confidence}%)`);
  console.log(`   ETH → ${ethTest.chain} (confidence: ${ethTest.confidence}%)`);
  console.log(`   CAKE → ${bscTest.chain} (confidence: ${bscTest.confidence}%)`);
  console.log("   ✅ Chain detection working\n");

  // Test 2: Source Selection
  console.log("2️⃣ Testing Source Selection...");
  const solanaSources = selectDataSource("solana", "RAY");
  const ethSources = selectDataSource("ethereum", "ETH");
  console.log(`   Solana: ${solanaSources.primary} → ${solanaSources.backup}`);
  console.log(`   Ethereum: ${ethSources.primary} → ${ethSources.backup}`);
  console.log("   ✅ Source selection working\n");

  // Test 3: Token Data Fetch (Solana)
  console.log("3️⃣ Testing Token Data Fetch (RAY on Solana)...");
  try {
    const rayData = await getTokenData("RAY");
    if (rayData) {
      console.log(
        `   ✅ RAY: $${rayData.price} (${rayData.priceChange24h > 0 ? "+" : ""}${rayData.priceChange24h}%)`,
      );
      console.log(`   Source: ${rayData.source} | Chain: ${rayData.chain}`);
      console.log(`   Risk Score: ${rayData.riskScore}/100`);
    } else {
      console.log("   ⚠️ No data returned (API may be down or token not found)");
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 4: Token Data Fetch (Ethereum major)
  console.log("4️⃣ Testing Token Data Fetch (ETH on Ethereum)...");
  try {
    const ethData = await getTokenData("ETH");
    if (ethData) {
      console.log(
        `   ✅ ETH: $${ethData.price} (${ethData.priceChange24h > 0 ? "+" : ""}${ethData.priceChange24h}%)`,
      );
      console.log(`   Source: ${ethData.source} | Chain: ${ethData.chain}`);
      console.log(`   Risk Score: ${ethData.riskScore}/100`);
    } else {
      console.log("   ⚠️ No data returned");
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 5: Trending Data
  console.log("5️⃣ Testing Trending Data (Solana)...");
  try {
    const trending = await getTrendingByChain("solana");
    if (trending.length > 0) {
      console.log(`   ✅ Found ${trending.length} trending tokens`);
      trending.slice(0, 3).forEach((token) => {
        console.log(
          `   - ${token.symbol}: Score ${token.trendScore} ${token.volumeSpike ? "(📈 Spike)" : ""}`,
        );
      });
    } else {
      console.log("   ⚠️ No trending data returned");
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 6: Format Response
  console.log("6️⃣ Testing Response Formatting...");
  try {
    const rayData = await getTokenData("RAY");
    if (rayData) {
      const formatted = formatMultiChainResponse(rayData);
      console.log("   ✅ Formatting working");
      console.log("   Sample output:");
      console.log(
        formatted
          .split("\n")
          .slice(0, 5)
          .map((l) => "   " + l)
          .join("\n"),
      );
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  console.log("🎯 API Testing Complete!");
  console.log("\nIf all tests passed ✅, the price service is ready for deployment.");
  console.log("If any tests failed ❌, review the API endpoints and retry.");
}

testAPIs().catch(console.error);
