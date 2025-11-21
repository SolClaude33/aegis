import type { LLMTradingDecision, StrategyType } from "./llm-clients.js";
import type { MarketData } from "./trading-strategies.js";

export interface ValidationContext {
  agentCapital: number;
  openPositions: {
    asset: string;
    size: number;
    entryPrice: number;
  }[];
  marketData: MarketData[];
  recentTrades: number; // Number of trades in current cycle
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  adjustedDecision?: Partial<LLMTradingDecision>;
}

// Risk limits constants
const LEVERAGE = 3; // 3x leverage configured on AsterDex
const MAX_POSITION_SIZE_PERCENT = 25; // Max 25% of capital per position (margin)
const MAX_LOSS_PER_TRADE_PERCENT = 5; // Max 5% loss per trade
const MAX_TRADES_PER_CYCLE = 3; // Max 3 trades per 2-minute cycle
const MIN_CAPITAL_TO_TRADE = 7; // Minimum $7 margin to place a trade

/**
 * Validates that the LLM decision complies with risk management rules
 */
export class TradingValidator {
  /**
   * Main validation function - checks all rules
   */
  validate(
    decision: LLMTradingDecision,
    context: ValidationContext
  ): ValidationResult {
    // HOLD decisions are always valid
    if (decision.action === "HOLD") {
      return { isValid: true };
    }

    // Check if agent has minimum capital
    if (context.agentCapital < MIN_CAPITAL_TO_TRADE) {
      return {
        isValid: false,
        reason: `Insufficient capital: $${context.agentCapital.toFixed(2)} < minimum $${MIN_CAPITAL_TO_TRADE}`,
      };
    }

    // Check trade frequency limit
    if (context.recentTrades >= MAX_TRADES_PER_CYCLE) {
      return {
        isValid: false,
        reason: `Trade frequency limit reached: ${context.recentTrades}/${MAX_TRADES_PER_CYCLE} trades in current cycle`,
      };
    }

    // Validate BUY decisions
    if (decision.action === "BUY") {
      return this.validateBuy(decision, context);
    }

    // Validate SELL decisions
    if (decision.action === "SELL") {
      return this.validateSell(decision, context);
    }

    return { isValid: false, reason: "Unknown action type" };
  }

  /**
   * Validates BUY decisions
   */
  private validateBuy(
    decision: LLMTradingDecision,
    context: ValidationContext
  ): ValidationResult {
    // Asset must be specified
    if (!decision.asset) {
      return { isValid: false, reason: "BUY decision missing asset symbol" };
    }

    // Check if already has position in this asset
    const existingPosition = context.openPositions.find(
      (p) => p.asset === decision.asset
    );
    if (existingPosition) {
      return {
        isValid: false,
        reason: `Already have open position in ${decision.asset}`,
      };
    }

    // Check position size limits
    const maxPositionSize = Math.min(
      decision.positionSizePercent,
      MAX_POSITION_SIZE_PERCENT
    );

    if (maxPositionSize <= 0) {
      return { isValid: false, reason: "Position size must be > 0%" };
    }

    // Strategy must be specified
    if (!decision.strategy) {
      return { isValid: false, reason: "BUY decision missing strategy" };
    }

    // Validate strategy logic (strategy-specific rules)
    const strategyValidation = this.validateStrategyLogic(
      decision.strategy,
      decision.asset,
      "BUY",
      context.marketData
    );

    if (!strategyValidation.isValid) {
      return strategyValidation;
    }

    // Calculate actual trade amount
    const tradeAmount = (context.agentCapital * maxPositionSize) / 100;
    const marketInfo = context.marketData.find((m) => m.symbol === decision.asset);

    if (!marketInfo) {
      return {
        isValid: false,
        reason: `No market data available for ${decision.asset}`,
      };
    }

    if (tradeAmount < 10) {
      return {
        isValid: false,
        reason: `Trade amount too small: $${tradeAmount.toFixed(2)} < $10 minimum`,
      };
    }

    // All checks passed, adjust position size if needed
    const adjustedDecision: Partial<LLMTradingDecision> = {};
    if (decision.positionSizePercent > MAX_POSITION_SIZE_PERCENT) {
      adjustedDecision.positionSizePercent = MAX_POSITION_SIZE_PERCENT;
    }

    return {
      isValid: true,
      adjustedDecision: Object.keys(adjustedDecision).length > 0 
        ? adjustedDecision 
        : undefined,
    };
  }

  /**
   * Validates SELL decisions
   */
  private validateSell(
    decision: LLMTradingDecision,
    context: ValidationContext
  ): ValidationResult {
    // Asset must be specified
    if (!decision.asset) {
      return { isValid: false, reason: "SELL decision missing asset symbol" };
    }

    // Must have existing position to sell
    const existingPosition = context.openPositions.find(
      (p) => p.asset === decision.asset
    );

    if (!existingPosition) {
      return {
        isValid: false,
        reason: `No open position in ${decision.asset} to sell`,
      };
    }

    // Check if selling would exceed max loss limit
    const marketInfo = context.marketData.find((m) => m.symbol === decision.asset);
    if (marketInfo) {
      const currentPrice = marketInfo.currentPrice;
      const entryPrice = existingPosition.entryPrice;
      const lossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

      // If loss is greater than max allowed, this is actually a good thing (stop-loss)
      // But we'll log it
      if (lossPercent < -MAX_LOSS_PER_TRADE_PERCENT) {
        console.log(
          `[Validator] Stop-loss triggered for ${decision.asset}: ${lossPercent.toFixed(2)}%`
        );
      }
    }

    return { isValid: true };
  }

  /**
   * Validates that the chosen strategy logic makes sense for current market conditions
   * 
   * NOTE: This validation is now VERY PERMISSIVE - IAs can trade freely based on their analysis
   * We only perform basic sanity checks, not strict percentage requirements.
   * The strategy is a GUIDELINE, not a hard restriction.
   */
  private validateStrategyLogic(
    strategy: StrategyType,
    asset: string,
    action: "BUY" | "SELL",
    marketData: MarketData[]
  ): ValidationResult {
    const market = marketData.find((m) => m.symbol === asset);
    if (!market) {
      return { isValid: true }; // Can't validate without data, let it through
    }

    const { change24h } = market;

    // Very permissive validation - only block extreme edge cases
    // IAs are free to interpret market conditions based on their strategy
    
    // Only block if trying to buy something that's extremely overbought (unlikely scenario)
    // or sell something extremely oversold (also unlikely)
    if (action === "BUY" && change24h > 50) {
        return {
          isValid: false,
        reason: `Market appears extremely overbought (+${change24h.toFixed(2)}%), blocking potential bad trade`,
        };
      }

    if (action === "SELL" && change24h < -50) {
        return {
          isValid: false,
        reason: `Market appears extremely oversold (${change24h.toFixed(2)}%), blocking potential bad trade`,
        };
    }

    // All other trades are allowed - IAs have freedom to interpret their strategy
    return { isValid: true };
  }
}

// Singleton validator instance
export const tradingValidator = new TradingValidator();
