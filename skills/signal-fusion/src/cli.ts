#!/usr/bin/env node
/**
 * Signal-Fusion CLI
 * Main command-line interface for the Signal-Fusion system
 */

import { Command } from "commander";
import { AdversarialValidator } from "./processors/AdversarialValidator.js";
import { AnomalyDetector } from "./processors/AnomalyDetector.js";
import { PatternMatcher } from "./processors/PatternMatcher.js";
import { SensorHub } from "./sensors/SensorHub.js";
import { EdgeDecayTracker } from "./synthesis/EdgeDecayTracker.js";
import { SignalSynthesizer } from "./synthesis/SignalSynthesizer.js";
import { TradeLedger } from "./synthesis/TradeLedger.js";
import { MarketType } from "./types/index.js";

const program = new Command();

program.name("signal-fusion").description("Hybrid trading intelligence system").version("1.0.0");

// Initialize components
const sensorHub = new SensorHub();
const anomalyDetector = new AnomalyDetector();
const patternMatcher = new PatternMatcher();
const adversarialValidator = new AdversarialValidator();
const synthesizer = new SignalSynthesizer();
const ledger = new TradeLedger();
const decayTracker = new EdgeDecayTracker();

// Analyze command
program
  .command("analyze <asset>")
  .description("Full multi-layer analysis of an asset")
  .option("-m, --market <type>", "Market type (crypto, stock, forex, commodity, penny)", "crypto")
  .option("-f, --format <format>", "Output format (cli, json)", "cli")
  .action(async (asset, options) => {
    console.log(`🧠 Analyzing ${asset}...\n`);

    const startTime = Date.now();

    try {
      // 1. Gather sensor data
      console.log("📡 Gathering data from sensors...");
      const sensorData = await sensorHub.gatherAllData(asset, options.market as MarketType);

      if (!sensorData.price) {
        console.error(`❌ Could not fetch price data for ${asset}`);
        process.exit(1);
      }

      console.log(`✅ Data gathered in ${Date.now() - startTime}ms\n`);

      // 2. Detect anomalies
      console.log("🔍 Detecting anomalies...");
      const anomalies = anomalyDetector.detectAnomalies(sensorData);
      console.log(`✅ Found ${anomalies.length} anomalies\n`);

      // 3. Match patterns
      console.log("🎯 Matching patterns...");
      const patternMatches = patternMatcher.matchPatterns(sensorData);
      const topPattern = patternMatches[0];
      console.log(`✅ Matched ${patternMatches.length} patterns\n`);

      // 4. Adversarial validation
      console.log("🛡️  Running adversarial tests...");
      const allSignals = [...anomalies];
      if (topPattern) {
        allSignals.push(patternMatcher.patternToSignal(topPattern, asset));
      }

      const validation = adversarialValidator.validateSignals(allSignals, sensorData);
      console.log(`✅ ${validation.summary}\n`);

      // 5. Synthesize
      console.log("🧬 Synthesizing final output...");
      const synthesis = synthesizer.synthesize({
        asset,
        marketType: options.market as MarketType,
        sensorData,
        signals: validation.validSignals,
        patternMatch: topPattern,
      });

      // 6. Record in ledger
      const entry = ledger.recordSignal(
        validation.validSignals[0] || allSignals[0],
        synthesis.tradeSetup,
        synthesis.edge,
        options.market,
      );

      // 7. Track edge decay
      if (validation.validSignals[0]) {
        decayTracker.registerSignal(validation.validSignals[0], synthesis.edge);
      }

      // Output
      console.log("\n" + "=".repeat(50));
      console.log(synthesis.summary);
      console.log("=".repeat(50) + "\n");

      if (options.format === "json") {
        console.log(
          JSON.stringify(
            {
              asset,
              sensorData,
              signals: validation.validSignals,
              edge: synthesis.edge,
              tradeSetup: synthesis.tradeSetup,
              ledgerEntryId: entry.id,
            },
            null,
            2,
          ),
        );
      } else {
        // Detailed CLI output
        console.log("📊 EDGE CALCULATION");
        console.log(
          `  Expected Value: ${synthesis.edge.expectedValue > 0 ? "+" : ""}${synthesis.edge.expectedValue.toFixed(2)}%`,
        );
        console.log(`  Win Rate: ${(synthesis.edge.winRate * 100).toFixed(0)}%`);
        console.log(`  Risk/Reward: 1:${synthesis.edge.riskReward.toFixed(1)}`);
        console.log(`  Conviction: ${synthesis.edge.convictionScore.toFixed(1)}/10`);
        console.log(`  Half-Life: ${synthesis.edge.halfLife}h\n`);

        console.log("🎯 TRADE SETUP");
        console.log(`  Direction: ${synthesis.tradeSetup.direction.toUpperCase()}`);
        console.log(
          `  Entry: $${synthesis.tradeSetup.entry.min.toFixed(2)} - $${synthesis.tradeSetup.entry.max.toFixed(2)}`,
        );
        console.log(
          `  Stop: $${synthesis.tradeSetup.stopLoss.toFixed(2)} (${((1 - synthesis.tradeSetup.stopLoss / synthesis.tradeSetup.entry.optimal) * 100).toFixed(1)}%)`,
        );
        console.log(
          `  Position: ${synthesis.tradeSetup.position.portfolioPercent.toFixed(1)}% of portfolio`,
        );
        console.log(
          `  Kelly Fraction: ${(synthesis.tradeSetup.position.kellyFraction * 100).toFixed(1)}%\n`,
        );

        console.log("📈 TARGETS");
        synthesis.tradeSetup.targets.forEach((target, i) => {
          console.log(
            `  ${i + 1}. $${target.price.toFixed(2)} (${target.percentage}% at ${(target.probability * 100).toFixed(0)}%) - ${target.action}`,
          );
        });
        console.log();

        if (synthesis.tradeSetup.warnings.length > 0) {
          console.log("⚠️  WARNINGS");
          synthesis.tradeSetup.warnings.forEach((w) => console.log(`  • ${w}`));
          console.log();
        }

        console.log(`📋 Ledger Entry: ${entry.id}`);
      }
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Quick command
program
  .command("quick <asset>")
  .description("Quick price check and sentiment")
  .option("-m, --market <type>", "Market type", "crypto")
  .action(async (asset, options) => {
    console.log(`⚡ Quick check for ${asset}\n`);

    const data = await sensorHub.gatherAllData(asset, options.market as MarketType);

    if (data.price) {
      console.log(`Price: $${data.price.price.toLocaleString()}`);
      console.log(
        `24h Change: ${data.price.change24h > 0 ? "+" : ""}${data.price.change24h.toFixed(2)}%`,
      );
      console.log(`24h Volume: $${(data.price.volume24h / 1e6).toFixed(2)}M`);
    }

    if (data.social) {
      console.log(`Sentiment: ${(data.social.sentimentScore * 100).toFixed(0)}%`);
      console.log(`Social Volume: ${data.social.volume24h} mentions`);
    }

    if (data.whale) {
      console.log(`Whale Flow: $${data.whale.netFlow24h.toLocaleString()}`);
    }
  });

// Compare command
program
  .command("compare <asset1> <asset2>")
  .description("Compare two assets")
  .option("-m, --market <type>", "Market type", "crypto")
  .action(async (asset1, asset2, options) => {
    console.log(`⚖️  Comparing ${asset1} vs ${asset2}\n`);

    const [data1, data2] = await Promise.all([
      sensorHub.gatherAllData(asset1, options.market as MarketType),
      sensorHub.gatherAllData(asset2, options.market as MarketType),
    ]);

    console.log(`${asset1.padEnd(10)} | ${asset2}`);
    console.log("-".repeat(50));

    if (data1.price && data2.price) {
      console.log(`$${data1.price.price.toFixed(2).padEnd(9)} | $${data2.price.price.toFixed(2)}`);
      console.log(
        `${(data1.price.change24h > 0 ? "+" : "").concat(data1.price.change24h.toFixed(1)).padEnd(9)}% | ${(data2.price.change24h > 0 ? "+" : "").concat(data2.price.change24h.toFixed(1))}%`,
      );
    }
  });

// Status command
program
  .command("status")
  .description("Show system status")
  .action(() => {
    console.log("🧠 Signal-Fusion System Status\n");
    console.log("Version: 1.0.0");
    console.log("Active Edges:", decayTracker.getActiveEdges().length);
    console.log("Total Trades:", ledger.getStats().totalTrades);
    console.log("\nSensors: ✅ Price, OnChain, Social, Macro, News");
    console.log("Processors: ✅ Anomaly, Pattern, Edge, Adversarial");
    console.log("Synthesis: ✅ Trade Constructor, Decay Tracker, Ledger");
  });

// Stats command
program
  .command("stats")
  .description("Show performance statistics")
  .option("-a, --asset <asset>", "Filter by asset")
  .action((options) => {
    ledger.getStats(options.asset);
    console.log(ledger.generateReport());
  });

// Decay command
program
  .command("decay")
  .description("Show edge decay tracking")
  .action(() => {
    // Update and show report
    decayTracker.updateAll();
    console.log(decayTracker.generateReport());
  });

program.parse();
