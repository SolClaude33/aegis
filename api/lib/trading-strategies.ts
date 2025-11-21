export interface TradingSignal {
  action: "BUY" | "SELL" | "HOLD";
  symbol: string;
  confidence: number; // 0-1
  quantity?: number;
  reason: string;
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  change24h: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  // Extended data for better AI decisions
  priceHistory?: {
    timestamp: number;
    price: number;
  }[]; // Last 4 hours of hourly prices
  shortTermTrend?: "UP" | "DOWN" | "SIDEWAYS"; // Trend in last 4 hours
  volatility?: number; // Price volatility in last 4 hours (%)
  distanceFromHigh?: number; // % distance from 24h high
  distanceFromLow?: number; // % distance from 24h low
  rsiApprox?: number; // Approximate RSI (0-100)
  // Alpha Vantage technical indicators (if available)
  rsi?: number; // Real RSI from Alpha Vantage (0-100)
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  adx?: number; // Average Directional Index (0-100, >25 = strong trend)
  stoch?: {
    k: number;
    d: number;
  }; // Stochastic oscillator
  // Market sentiment data from Alpha Vantage
  sentiment?: {
    overallSentiment?: "BULLISH" | "BEARISH" | "NEUTRAL";
    sentimentScore?: number; // -1 (very bearish) to +1 (very bullish)
    bullishPercent?: number; // % of bullish articles
    bearishPercent?: number; // % of bearish articles
    recentNewsCount?: number; // Number of recent news articles analyzed
  };
}

export interface StrategyContext {
  agentBalance: number;
  currentPositions: Map<string, number>; // symbol -> quantity
  marketData: MarketData[];
  riskTolerance: "low" | "medium" | "high";
  maxPositionSizePercent: number;
}

export abstract class TradingStrategy {
  abstract name: string;
  abstract analyze(context: StrategyContext): TradingSignal[];

  protected calculatePositionSize(
    balance: number,
    maxPositionPercent: number,
    price: number
  ): number {
    const maxInvestment = balance * (maxPositionPercent / 100);
    return maxInvestment / price;
  }

  protected hasExistingPosition(
    symbol: string,
    positions: Map<string, number>
  ): boolean {
    return positions.has(symbol) && (positions.get(symbol) || 0) > 0;
  }
}

export class MomentumStrategy extends TradingStrategy {
  name = "Momentum Trading";

  analyze(context: StrategyContext): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (const market of context.marketData) {
      if (market.change24h > 5 && !this.hasExistingPosition(market.symbol, context.currentPositions)) {
        const quantity = this.calculatePositionSize(
          context.agentBalance,
          context.maxPositionSizePercent,
          market.currentPrice
        );

        signals.push({
          action: "BUY",
          symbol: market.symbol,
          confidence: Math.min(market.change24h / 10, 1),
          quantity,
          reason: `Strong upward momentum detected: +${market.change24h.toFixed(2)}% in 24h`,
        });
      } else if (
        market.change24h < -3 &&
        this.hasExistingPosition(market.symbol, context.currentPositions)
      ) {
        signals.push({
          action: "SELL",
          symbol: market.symbol,
          confidence: Math.min(Math.abs(market.change24h) / 10, 1),
          quantity: context.currentPositions.get(market.symbol),
          reason: `Momentum weakening: ${market.change24h.toFixed(2)}% drop`,
        });
      }
    }

    return signals;
  }
}

export class SwingTradingStrategy extends TradingStrategy {
  name = "Swing Trading";

  analyze(context: StrategyContext): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (const market of context.marketData) {
      const isOversold = market.change24h < -8;
      const isOverbought = market.change24h > 12;

      if (isOversold && !this.hasExistingPosition(market.symbol, context.currentPositions)) {
        const quantity = this.calculatePositionSize(
          context.agentBalance,
          context.maxPositionSizePercent,
          market.currentPrice
        );

        signals.push({
          action: "BUY",
          symbol: market.symbol,
          confidence: Math.min(Math.abs(market.change24h) / 15, 0.9),
          quantity,
          reason: `Oversold condition: ${market.change24h.toFixed(2)}% drop presents swing opportunity`,
        });
      } else if (
        isOverbought &&
        this.hasExistingPosition(market.symbol, context.currentPositions)
      ) {
        signals.push({
          action: "SELL",
          symbol: market.symbol,
          confidence: Math.min(market.change24h / 15, 0.9),
          quantity: context.currentPositions.get(market.symbol),
          reason: `Overbought condition: +${market.change24h.toFixed(2)}% gain suggests pullback`,
        });
      }
    }

    return signals;
  }
}

export class ConservativeStrategy extends TradingStrategy {
  name = "Conservative";

  analyze(context: StrategyContext): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (const market of context.marketData) {
      const isModerateGain = market.change24h > 2 && market.change24h < 8;

      if (isModerateGain && !this.hasExistingPosition(market.symbol, context.currentPositions)) {
        const quantity = this.calculatePositionSize(
          context.agentBalance,
          context.maxPositionSizePercent * 0.6,
          market.currentPrice
        );

        signals.push({
          action: "BUY",
          symbol: market.symbol,
          confidence: 0.6,
          quantity,
          reason: `Steady moderate growth: +${market.change24h.toFixed(2)}% suggests stability`,
        });
      } else if (
        market.change24h < -2 &&
        this.hasExistingPosition(market.symbol, context.currentPositions)
      ) {
        signals.push({
          action: "SELL",
          symbol: market.symbol,
          confidence: 0.7,
          quantity: context.currentPositions.get(market.symbol),
          reason: `Risk mitigation: ${market.change24h.toFixed(2)}% decline triggers conservative exit`,
        });
      }
    }

    return signals;
  }
}

export class AggressiveStrategy extends TradingStrategy {
  name = "Aggressive High-Risk";

  analyze(context: StrategyContext): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (const market of context.marketData) {
      if (market.change24h > 10 && !this.hasExistingPosition(market.symbol, context.currentPositions)) {
        const quantity = this.calculatePositionSize(
          context.agentBalance,
          context.maxPositionSizePercent * 1.5,
          market.currentPrice
        );

        signals.push({
          action: "BUY",
          symbol: market.symbol,
          confidence: 0.95,
          quantity,
          reason: `High volatility opportunity: +${market.change24h.toFixed(2)}% surge`,
        });
      } else if (
        (market.change24h < -5 || market.change24h > 20) &&
        this.hasExistingPosition(market.symbol, context.currentPositions)
      ) {
        signals.push({
          action: "SELL",
          symbol: market.symbol,
          confidence: 0.85,
          quantity: context.currentPositions.get(market.symbol),
          reason: market.change24h < -5
            ? `Stop-loss triggered: ${market.change24h.toFixed(2)}%`
            : `Take profit at peak: +${market.change24h.toFixed(2)}%`,
        });
      }
    }

    return signals;
  }
}

export class TrendFollowerStrategy extends TradingStrategy {
  name = "Trend Follower";

  analyze(context: StrategyContext): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (const market of context.marketData) {
      const isUptrend = market.change24h > 3;
      const isDowntrend = market.change24h < -4;

      if (isUptrend && !this.hasExistingPosition(market.symbol, context.currentPositions)) {
        const quantity = this.calculatePositionSize(
          context.agentBalance,
          context.maxPositionSizePercent,
          market.currentPrice
        );

        signals.push({
          action: "BUY",
          symbol: market.symbol,
          confidence: Math.min(market.change24h / 8, 0.9),
          quantity,
          reason: `Following uptrend: +${market.change24h.toFixed(2)}% momentum`,
        });
      } else if (
        isDowntrend &&
        this.hasExistingPosition(market.symbol, context.currentPositions)
      ) {
        signals.push({
          action: "SELL",
          symbol: market.symbol,
          confidence: Math.min(Math.abs(market.change24h) / 8, 0.9),
          quantity: context.currentPositions.get(market.symbol),
          reason: `Trend reversal detected: ${market.change24h.toFixed(2)}% downtrend`,
        });
      }
    }

    return signals;
  }
}

export class MeanReversionStrategy extends TradingStrategy {
  name = "Mean Reversion";

  analyze(context: StrategyContext): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (const market of context.marketData) {
      const isExtremelyLow = market.change24h < -10;
      const isExtremelyHigh = market.change24h > 10;

      if (isExtremelyLow && !this.hasExistingPosition(market.symbol, context.currentPositions)) {
        const quantity = this.calculatePositionSize(
          context.agentBalance,
          context.maxPositionSizePercent,
          market.currentPrice
        );

        signals.push({
          action: "BUY",
          symbol: market.symbol,
          confidence: Math.min(Math.abs(market.change24h) / 12, 0.95),
          quantity,
          reason: `Mean reversion opportunity: ${market.change24h.toFixed(2)}% oversold`,
        });
      } else if (
        isExtremelyHigh &&
        this.hasExistingPosition(market.symbol, context.currentPositions)
      ) {
        signals.push({
          action: "SELL",
          symbol: market.symbol,
          confidence: Math.min(market.change24h / 12, 0.95),
          quantity: context.currentPositions.get(market.symbol),
          reason: `Mean reversion: +${market.change24h.toFixed(2)}% overbought, expecting pullback`,
        });
      }
    }

    return signals;
  }
}

export function getStrategyForAgent(strategyType: string): TradingStrategy {
  switch (strategyType) {
    case "momentum":
      return new MomentumStrategy();
    case "swing":
      return new SwingTradingStrategy();
    case "conservative":
      return new ConservativeStrategy();
    case "aggressive":
      return new AggressiveStrategy();
    case "trend_follower":
      return new TrendFollowerStrategy();
    case "mean_reversion":
      return new MeanReversionStrategy();
    default:
      return new ConservativeStrategy();
  }
}
