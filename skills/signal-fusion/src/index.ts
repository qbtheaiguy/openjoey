/**
 * Signal-Fusion Main Entry Point
 * Orchestrates all layers: Sensors → Processors → Synthesis → Council
 */

export { SensorHub } from "./sensors/SensorHub.js";
export { PriceFeedSensor } from "./sensors/PriceFeedSensor.js";
export { OnChainSensor } from "./sensors/OnChainSensor.js";
export { SocialSensor } from "./sensors/SocialSensor.js";
export { MacroSensor } from "./sensors/MacroSensor.js";
export { NewsSensor } from "./sensors/NewsSensor.js";

export { AnomalyDetector } from "./processors/AnomalyDetector.js";
export { PatternMatcher } from "./processors/PatternMatcher.js";
export { EdgeCalculator } from "./processors/EdgeCalculator.js";
export { AdversarialValidator } from "./processors/AdversarialValidator.js";

export { SignalSynthesizer } from "./synthesis/SignalSynthesizer.js";
export { EdgeDecayTracker } from "./synthesis/EdgeDecayTracker.js";
export { TradeLedger } from "./synthesis/TradeLedger.js";

export { MarketSpecialistsCouncil } from "./council/MarketSpecialists.js";
export { SkillSpecialistsCouncil } from "./council/SkillSpecialists.js";
export { FinalMessenger } from "./council/FinalMessenger.js";

export * from "./types/index.js";

import { FinalMessenger } from "./council/FinalMessenger.js";
import { MarketSpecialistsCouncil } from "./council/MarketSpecialists.js";
import { SkillSpecialistsCouncil } from "./council/SkillSpecialists.js";
import { AdversarialValidator } from "./processors/AdversarialValidator.js";
import { AnomalyDetector } from "./processors/AnomalyDetector.js";
import { PatternMatcher } from "./processors/PatternMatcher.js";
import { SensorHub } from "./sensors/SensorHub.js";
import { SignalSynthesizer } from "./synthesis/SignalSynthesizer.js";
import { TradeLedger } from "./synthesis/TradeLedger.js";
import { MarketType, SignalFusionOutput } from "./types/index.js";

export interface AnalysisRequest {
  asset: string;
  marketType: MarketType;
  query?: string;
}

export class SignalFusion {
  private sensorHub: SensorHub;
  private anomalyDetector: AnomalyDetector;
  private patternMatcher: PatternMatcher;
  private adversarialValidator: AdversarialValidator;
  private synthesizer: SignalSynthesizer;
  private ledger: TradeLedger;
  private marketCouncil: MarketSpecialistsCouncil;
  private skillCouncil: SkillSpecialistsCouncil;
  private finalMessenger: FinalMessenger;

  constructor() {
    this.sensorHub = new SensorHub();
    this.anomalyDetector = new AnomalyDetector();
    this.patternMatcher = new PatternMatcher();
    this.adversarialValidator = new AdversarialValidator();
    this.synthesizer = new SignalSynthesizer();
    this.ledger = new TradeLedger();
    this.marketCouncil = new MarketSpecialistsCouncil();
    this.skillCouncil = new SkillSpecialistsCouncil();
    this.finalMessenger = new FinalMessenger();
  }

  /**
   * Perform full Signal-Fusion analysis
   */
  async analyze(request: AnalysisRequest): Promise<SignalFusionOutput> {
    const startTime = Date.now();
    const { asset, marketType, query = `Analyze ${asset}` } = request;

    // 1. Layer 1: Signal Swarm - Gather data
    const sensorData = await this.sensorHub.gatherAllData(asset, marketType);

    if (!sensorData.price) {
      throw new Error(`Unable to fetch price data for ${asset}`);
    }

    // 2. Layer 1: Signal Swarm - Process signals
    const anomalies = this.anomalyDetector.detectAnomalies(sensorData);
    const patternMatches = this.patternMatcher.matchPatterns(sensorData);
    const topPattern = patternMatches[0];

    // Combine all signals
    const allSignals = [...anomalies];
    if (topPattern) {
      allSignals.push(this.patternMatcher.patternToSignal(topPattern, asset));
    }

    // 3. Layer 1: Signal Swarm - Validate
    const validation = this.adversarialValidator.validateSignals(allSignals, sensorData);

    // 4. Layer 1: Signal Swarm - Synthesize
    const synthesis = this.synthesizer.synthesize({
      asset,
      marketType,
      sensorData,
      signals: validation.validSignals,
      patternMatch: topPattern,
    });

    // 5. Layer 2: Trading Council - Market Specialist
    const marketSpecialist = this.marketCouncil.getSpecialistForMarket(marketType);
    const marketOpinion = marketSpecialist
      ? this.marketCouncil.generateOpinion({
          member: marketSpecialist,
          sensorData,
          edge: synthesis.edge,
          tradeSetup: synthesis.tradeSetup,
        })
      : undefined;

    // 6. Layer 2: Trading Council - Skill Specialists
    const skillOpinions = this.skillCouncil.generateOpinions(
      sensorData,
      synthesis.edge,
      synthesis.tradeSetup,
    );

    // 7. Layer 3: Final Messenger
    const processingTime = Date.now() - startTime;
    const output = this.finalMessenger.synthesize({
      query,
      asset,
      marketType,
      edge: synthesis.edge,
      tradeSetup: synthesis.tradeSetup,
      signals: validation.validSignals,
      marketOpinion,
      skillOpinions,
      processingTime,
    });

    // 8. Record in ledger
    if (validation.validSignals[0]) {
      this.ledger.recordSignal(
        validation.validSignals[0],
        synthesis.tradeSetup,
        synthesis.edge,
        marketType,
      );
    }

    return output;
  }

  /**
   * Quick price check
   */
  async quickCheck(asset: string, marketType: MarketType = "crypto") {
    return this.sensorHub.gatherAllData(asset, marketType);
  }

  /**
   * Get ledger stats
   */
  getStats(asset?: string) {
    return this.ledger.getStats(asset);
  }

  /**
   * Format output for channel
   */
  formatOutput(
    output: SignalFusionOutput,
    channel: "cli" | "discord" | "telegram" | "slack",
  ): string {
    return this.finalMessenger.formatOutput(output, channel);
  }
}

export default SignalFusion;
