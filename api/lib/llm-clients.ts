import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MarketData } from "./trading-strategies.js";

// Supported cryptocurrencies
export const SUPPORTED_CRYPTOS = ["BTC", "ETH", "BNB"] as const;
export type SupportedCrypto = typeof SUPPORTED_CRYPTOS[number];

// Available trading strategies
export const TRADING_STRATEGIES = {
  momentum: {
    name: "Momentum Trading",
    description: "Buys assets showing strong upward momentum (>5% gains). Sells when momentum weakens (<-3%). Best for trending markets.",
  },
  swing: {
    name: "Swing Trading",
    description: "Buys oversold assets (<-8% drop) expecting bounce. Sells overbought assets (>12% gains). Best for volatile sideways markets.",
  },
  conservative: {
    name: "Conservative",
    description: "Buys steady moderate gains (2-8%). Sells on any -2% drop. Lower position sizes. Best for risk-averse trading.",
  },
  aggressive: {
    name: "Aggressive High-Risk",
    description: "Buys extreme volatility (>10% surge). Uses larger position sizes. Stop-loss at -5% or take-profit at +20%. Best for high-risk tolerance.",
  },
  trend_follower: {
    name: "Trend Follower",
    description: "Rides established trends. Buys uptrends (>3%). Sells on trend reversal (<-4%). Best for strong directional markets.",
  },
  mean_reversion: {
    name: "Mean Reversion",
    description: "Buys extreme oversold (<-10%). Sells extreme overbought (>10%). Expects price to revert to average. Best for range-bound markets.",
  },
} as const;

export type StrategyType = keyof typeof TRADING_STRATEGIES;

// LLM Decision response format
export interface LLMTradingDecision {
  action: "BUY" | "SELL" | "HOLD";
  asset: SupportedCrypto | null;
  strategy: StrategyType | null;
  positionSizePercent: number; // 0-100
  reasoning: string;
  confidence: number; // 0-1
}

// Context provided to LLM for analysis
export interface LLMAnalysisContext {
  agentName: string;
  currentCapital: number;
  openPositions: {
    asset: string;
    size: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
  }[];
  marketData: (MarketData & { symbol: SupportedCrypto })[];
  previousDecisions?: string[]; // Last 3 decisions for context
}

// Common interface for all LLM clients
export interface LLMClient {
  analyzeMarket(context: LLMAnalysisContext): Promise<LLMTradingDecision>;
}

// OpenAI client (GPT-5)
export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4-turbo") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyzeMarket(context: LLMAnalysisContext): Promise<LLMTradingDecision> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert cryptocurrency trading AI. Analyze market data and make disciplined trading decisions. Always respond in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from OpenAI");

      return this.parseResponse(content);
    } catch (error) {
      console.error(`[OpenAI] Error analyzing market:`, error);
      return this.getDefaultDecision("Error calling OpenAI API");
    }
  }

  private buildPrompt(context: LLMAnalysisContext): string {
    const strategiesDesc = Object.entries(TRADING_STRATEGIES)
      .map(([key, val]) => `- ${key}: ${val.description}`)
      .join("\n");

    const marketsDesc = context.marketData
      .map(m => `${m.symbol}: $${m.currentPrice.toFixed(2)} (24h: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}%)`)
      .join("\n");

    const positionsDesc = context.openPositions.length > 0
      ? context.openPositions.map(p => 
          `${p.asset}: ${p.size.toFixed(4)} units @ $${p.entryPrice.toFixed(2)} (PnL: ${p.unrealizedPnL > 0 ? '+' : ''}$${p.unrealizedPnL.toFixed(2)})`
        ).join("\n")
      : "No open positions";

    return `You are ${context.agentName}, an AI trading agent competing against other AIs in a competitive trading arena.

CURRENT STATE:
- Capital: $${context.currentCapital.toFixed(2)}
- Open Positions:
${positionsDesc}

MARKET DATA (3 cryptocurrencies):
${marketsDesc}

AVAILABLE STRATEGIES (use as GUIDELINES, not strict rules):
${strategiesDesc}

IMPORTANT: Strategy descriptions show IDEAL conditions, but you should INTERPRET them flexibly. Look for opportunities even if conditions don't match perfectly. For example:
- Momentum strategy can work with smaller gains if trend is strong
- Swing trading can work with smaller drops if asset shows support
- Conservative strategy can adapt to current market conditions
- Be PROACTIVE - find trading opportunities, don't wait for perfect conditions

RISK LIMITS (ENFORCED):
- Max position size: 25% of capital per trade (margin)
- Trading with 3x leverage: If you use $25 margin, AsterDex executes $75 notional
- Max loss per trade: 5%
- Max 3 trades per 2-minute cycle
- Minimum trade: $7 margin

TASK:
Be PROACTIVE and find trading opportunities. Analyze the market and decide:
1. Which action: BUY, SELL, or HOLD (prefer BUY/SELL over HOLD when opportunities exist)
2. Which asset: ${SUPPORTED_CRYPTOS.join(", ")} (or null if HOLD)
3. Which strategy to use: momentum, swing, conservative, aggressive, trend_follower, or mean_reversion (or null if HOLD)
4. Position size as % of capital: 0-25 (or 0 if HOLD). This is your margin, AsterDex will multiply by 3x leverage
5. Your reasoning (concise)
6. Confidence level: 0.0-1.0

Remember: You're competing against other AIs. Being too conservative means losing. Look for opportunities and trade when you see potential, even if conditions aren't perfect.

Respond ONLY with valid JSON:
{
  "action": "BUY" | "SELL" | "HOLD",
  "asset": "BTC" | "ETH" | "BNB" | null,
  "strategy": "momentum" | "swing" | "conservative" | "aggressive" | "trend_follower" | "mean_reversion" | null,
  "positionSizePercent": 0-25,
  "reasoning": "your analysis",
  "confidence": 0.0-1.0
}`;
  }

  private parseResponse(content: string): LLMTradingDecision {
    try {
      const parsed = JSON.parse(content);
      
      // Validate and sanitize
      return {
        action: parsed.action === "BUY" || parsed.action === "SELL" ? parsed.action : "HOLD",
        asset: SUPPORTED_CRYPTOS.includes(parsed.asset) ? parsed.asset : null,
        strategy: parsed.strategy && TRADING_STRATEGIES[parsed.strategy as StrategyType] 
          ? parsed.strategy 
          : null,
        positionSizePercent: Math.min(Math.max(parsed.positionSizePercent || 0, 0), 25),
        reasoning: parsed.reasoning || "No reasoning provided",
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      };
    } catch (error) {
      console.error("[OpenAI] Failed to parse response:", content);
      return this.getDefaultDecision("Invalid JSON response");
    }
  }

  private getDefaultDecision(reason: string): LLMTradingDecision {
    return {
      action: "HOLD",
      asset: null,
      strategy: null,
      positionSizePercent: 0,
      reasoning: reason,
      confidence: 0,
    };
  }
}

// Anthropic client (Claude)
export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    // Use environment variable or default to latest Claude 3.5 Sonnet
    this.model = model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  }

  async analyzeMarket(context: LLMAnalysisContext): Promise<LLMTradingDecision> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") throw new Error("Unexpected response type");

      return this.parseResponse(content.text);
    } catch (error: any) {
      // Log detailed error information for debugging
      const errorStatus = error?.status || error?.statusCode;
      const errorType = error?.error?.type || error?.type;
      const errorMessage = error?.message || error?.error?.message || "Unknown error";
      
      console.error(`[Anthropic] Error details for ${context.agentName}:`, {
        status: errorStatus,
        type: errorType,
        message: errorMessage,
        model: this.model,
        error: error?.error || error,
      });

      // Handle specific Anthropic API errors
      if (errorStatus === 529 || errorType === "overloaded_error") {
        console.warn(`[Anthropic] Service overloaded (529), using default HOLD decision for ${context.agentName}`);
        return this.getDefaultDecision("Claude API temporarily overloaded - holding position");
      }
      
      // Check for authentication errors
      if (errorStatus === 401 || errorStatus === 403) {
        console.error(`[Anthropic] Authentication error (${errorStatus}) - Check API key for ${context.agentName}`);
        return this.getDefaultDecision(`Claude API authentication error (${errorStatus}) - check API key`);
      }
      
      // Check for rate limit errors
      if (errorStatus === 429) {
        console.warn(`[Anthropic] Rate limit exceeded for ${context.agentName}`);
        return this.getDefaultDecision("Claude API rate limit exceeded - holding position");
      }
      
      // Check for model errors
      if (errorStatus === 400 && errorMessage?.includes("model")) {
        console.error(`[Anthropic] Model error - Check if model "${this.model}" is valid`);
        return this.getDefaultDecision(`Invalid model "${this.model}" - check model name`);
      }
      
      console.error(`[Anthropic] Unexpected error (${errorStatus || "unknown"}) for ${context.agentName}`);
      return this.getDefaultDecision(`Error calling Claude API: ${errorMessage}`);
    }
  }

  private buildPrompt(context: LLMAnalysisContext): string {
    const strategiesDesc = Object.entries(TRADING_STRATEGIES)
      .map(([key, val]) => `- ${key}: ${val.description}`)
      .join("\n");

    const marketsDesc = context.marketData
      .map(m => `${m.symbol}: $${m.currentPrice.toFixed(2)} (24h: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}%)`)
      .join("\n");

    const positionsDesc = context.openPositions.length > 0
      ? context.openPositions.map(p => 
          `${p.asset}: ${p.size.toFixed(4)} units @ $${p.entryPrice.toFixed(2)} (PnL: ${p.unrealizedPnL > 0 ? '+' : ''}$${p.unrealizedPnL.toFixed(2)})`
        ).join("\n")
      : "No open positions";

    return `You are ${context.agentName}, an AI trading agent in a competitive trading arena.

CURRENT STATE:
- Capital: $${context.currentCapital.toFixed(2)}
- Open Positions:
${positionsDesc}

MARKET DATA:
${marketsDesc}

AVAILABLE STRATEGIES (use as GUIDELINES, not strict rules):
${strategiesDesc}

IMPORTANT: Strategy descriptions show IDEAL conditions, but you should INTERPRET them flexibly. Look for opportunities even if conditions don't match perfectly. For example:
- Momentum strategy can work with smaller gains if trend is strong
- Swing trading can work with smaller drops if asset shows support
- Conservative strategy can adapt to current market conditions
- Be PROACTIVE - find trading opportunities, don't wait for perfect conditions

CONSTRAINTS:
- Max 25% position size per trade (margin)
- Trading with 3x leverage: If you use $25 margin, AsterDex executes $75 notional
- Max 5% loss per trade
- Max 3 trades per cycle
- Minimum trade: $7 margin

TASK:
Be PROACTIVE and find trading opportunities. Analyze and decide: BUY/SELL/HOLD which asset using which strategy.
Remember: You're competing against other AIs. Being too conservative means losing. Look for opportunities and trade when you see potential, even if conditions aren't perfect.

Respond with ONLY valid JSON:
{
  "action": "BUY" | "SELL" | "HOLD",
  "asset": "BTC" | "ETH" | "BNB" | null,
  "strategy": "momentum" | "swing" | "conservative" | "aggressive" | "trend_follower" | "mean_reversion" | null,
  "positionSizePercent": 0-25,
  "reasoning": "brief explanation",
  "confidence": 0.0-1.0
}`;
  }

  private parseResponse(content: string): LLMTradingDecision {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        action: parsed.action === "BUY" || parsed.action === "SELL" ? parsed.action : "HOLD",
        asset: SUPPORTED_CRYPTOS.includes(parsed.asset) ? parsed.asset : null,
        strategy: parsed.strategy && TRADING_STRATEGIES[parsed.strategy as StrategyType] 
          ? parsed.strategy 
          : null,
        positionSizePercent: Math.min(Math.max(parsed.positionSizePercent || 0, 0), 25),
        reasoning: parsed.reasoning || "No reasoning provided",
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      };
    } catch (error) {
      console.error("[Anthropic] Failed to parse response:", content);
      return this.getDefaultDecision("Invalid JSON response");
    }
  }

  private getDefaultDecision(reason: string): LLMTradingDecision {
    return {
      action: "HOLD",
      asset: null,
      strategy: null,
      positionSizePercent: 0,
      reasoning: reason,
      confidence: 0,
    };
  }
}

// Google Gemini client
export class GeminiClient implements LLMClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.0-flash-exp") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async analyzeMarket(context: LLMAnalysisContext): Promise<LLMTradingDecision> {
    const prompt = this.buildPrompt(context);

    try {
      const model = this.client.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      if (!content) throw new Error("No response from Gemini");

      return this.parseResponse(content);
    } catch (error) {
      console.error(`[Gemini] Error analyzing market:`, error);
      return this.getDefaultDecision("Error calling Gemini API");
    }
  }

  private buildPrompt(context: LLMAnalysisContext): string {
    const strategiesDesc = Object.entries(TRADING_STRATEGIES)
      .map(([key, val]) => `- ${key}: ${val.description}`)
      .join("\n");

    const marketsDesc = context.marketData
      .map(m => `${m.symbol}: $${m.currentPrice.toFixed(2)} (24h: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}%)`)
      .join("\n");

    const positionsDesc = context.openPositions.length > 0
      ? context.openPositions.map(p => 
          `${p.asset}: ${p.size.toFixed(4)} units @ $${p.entryPrice.toFixed(2)} (PnL: ${p.unrealizedPnL > 0 ? '+' : ''}$${p.unrealizedPnL.toFixed(2)})`
        ).join("\n")
      : "No open positions";

    return `You are ${context.agentName}, competing in an AI trading competition.

STATE:
Capital: $${context.currentCapital.toFixed(2)}
Positions: 
${positionsDesc}

MARKETS:
${marketsDesc}

STRATEGIES (use as GUIDELINES, not strict rules):
${strategiesDesc}

IMPORTANT: Strategy descriptions show IDEAL conditions, but INTERPRET them flexibly. Look for opportunities even if conditions don't match perfectly. Be PROACTIVE - find trading opportunities, don't wait for perfect conditions. You're competing against other AIs - being too conservative means losing.

RULES:
- Max 25% per position (margin)
- Trading with 3x leverage: If you use $25 margin, AsterDex executes $75 notional
- Max 5% loss per trade
- Minimum trade: $7 margin
- Choose best strategy for current conditions

Be PROACTIVE and find trading opportunities. Prefer BUY/SELL over HOLD when opportunities exist.

Return JSON only:
{
  "action": "BUY" | "SELL" | "HOLD",
  "asset": "BTC" | "ETH" | "BNB" | null,
  "strategy": "momentum" | "swing" | "conservative" | "aggressive" | "trend_follower" | "mean_reversion" | null,
  "positionSizePercent": 0-25,
  "reasoning": "why",
  "confidence": 0.0-1.0
}`;
  }

  private parseResponse(content: string): LLMTradingDecision {
    try {
      const parsed = JSON.parse(content);
      
      return {
        action: parsed.action === "BUY" || parsed.action === "SELL" ? parsed.action : "HOLD",
        asset: SUPPORTED_CRYPTOS.includes(parsed.asset) ? parsed.asset : null,
        strategy: parsed.strategy && TRADING_STRATEGIES[parsed.strategy as StrategyType] 
          ? parsed.strategy 
          : null,
        positionSizePercent: Math.min(Math.max(parsed.positionSizePercent || 0, 0), 25),
        reasoning: parsed.reasoning || "No reasoning provided",
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      };
    } catch (error) {
      console.error("[Gemini] Failed to parse response:", content);
      return this.getDefaultDecision("Invalid JSON response");
    }
  }

  private getDefaultDecision(reason: string): LLMTradingDecision {
    return {
      action: "HOLD",
      asset: null,
      strategy: null,
      positionSizePercent: 0,
      reasoning: reason,
      confidence: 0,
    };
  }
}

// OpenAI-compatible clients (xAI Grok, DeepSeek)
export class OpenAICompatibleClient implements LLMClient {
  private client: OpenAI;
  private model: string;
  private providerName: string;

  constructor(apiKey: string, baseURL: string, model: string, providerName: string) {
    // OpenAI-compatible format
    // API key should be in format: sk-xxxxx or just the key string
    const normalizedKey = apiKey.trim();
    
    this.client = new OpenAI({ 
      apiKey: normalizedKey, 
      baseURL,
      // The SDK automatically handles Authorization header with Bearer token
    });
    this.model = model;
    this.providerName = providerName;
  }

  async analyzeMarket(context: LLMAnalysisContext): Promise<LLMTradingDecision> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert cryptocurrency trading AI. Respond only in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error(`No response from ${this.providerName}`);

      return this.parseResponse(content);
    } catch (error: any) {
      // Better error logging for debugging
      if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Incorrect API key')) {
        console.error(`[${this.providerName}] Authentication failed: Check API key in environment variable`);
      }
      if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('Access to model denied')) {
        console.error(`[${this.providerName}] Model access denied: The model may require special permissions`);
      }
      console.error(`[${this.providerName}] Error analyzing market:`, error?.message || error);
      return this.getDefaultDecision(`Error calling ${this.providerName} API`);
    }
  }

  private buildPrompt(context: LLMAnalysisContext): string {
    const strategiesDesc = Object.entries(TRADING_STRATEGIES)
      .map(([key, val]) => `- ${key}: ${val.description}`)
      .join("\n");

    const marketsDesc = context.marketData
      .map(m => `${m.symbol}: $${m.currentPrice.toFixed(2)} (24h: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}%)`)
      .join("\n");

    const positionsDesc = context.openPositions.length > 0
      ? context.openPositions.map(p => 
          `${p.asset}: ${p.size.toFixed(4)} units @ $${p.entryPrice.toFixed(2)} (PnL: ${p.unrealizedPnL > 0 ? '+' : ''}$${p.unrealizedPnL.toFixed(2)})`
        ).join("\n")
      : "No open positions";

    return `${context.agentName} - AI Trading Agent

Capital: $${context.currentCapital.toFixed(2)}
Positions: ${positionsDesc}

Markets:
${marketsDesc}

Strategies (use as GUIDELINES, not strict rules):
${strategiesDesc}

IMPORTANT: Strategy descriptions show IDEAL conditions, but INTERPRET them flexibly. Look for opportunities even if conditions don't match perfectly. Be PROACTIVE - find trading opportunities, don't wait for perfect conditions. You're competing against other AIs - being too conservative means losing.

Rules: Max 25% position size (margin), 3x leverage on AsterDex, min $7 margin.

Be PROACTIVE and find trading opportunities. Prefer BUY/SELL over HOLD when opportunities exist.

Decide: action, asset, strategy, position size (0-25% margin, AsterDex applies 3x leverage), reasoning, confidence.

JSON only:
{
  "action": "BUY"|"SELL"|"HOLD",
  "asset": "BTC"|"ETH"|"BNB"|null,
  "strategy": "momentum"|"swing"|"conservative"|"aggressive"|"trend_follower"|"mean_reversion"|null,
  "positionSizePercent": 0-25,
  "reasoning": "why",
  "confidence": 0.0-1.0
}`;
  }

  private parseResponse(content: string): LLMTradingDecision {
    try {
      // Try to extract JSON from markdown or plain text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        action: parsed.action === "BUY" || parsed.action === "SELL" ? parsed.action : "HOLD",
        asset: SUPPORTED_CRYPTOS.includes(parsed.asset) ? parsed.asset : null,
        strategy: parsed.strategy && TRADING_STRATEGIES[parsed.strategy as StrategyType] 
          ? parsed.strategy 
          : null,
        positionSizePercent: Math.min(Math.max(parsed.positionSizePercent || 0, 0), 25),
        reasoning: parsed.reasoning || "No reasoning provided",
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      };
    } catch (error) {
      console.error(`[${this.providerName}] Failed to parse response:`, content);
      return this.getDefaultDecision("Invalid JSON response");
    }
  }

  private getDefaultDecision(reason: string): LLMTradingDecision {
    return {
      action: "HOLD",
      asset: null,
      strategy: null,
      positionSizePercent: 0,
      reasoning: reason,
      confidence: 0,
    };
  }
}

// Factory function to get LLM client for each agent
export function getLLMClientForAgent(agentName: string): LLMClient | null {
  const envVarMap: Record<string, { keyVar: string; provider: string; baseURL?: string; model?: string }> = {
    "DeepSeek-R1": { 
      keyVar: "LLM_DEEPSEEK_API_KEY", 
      provider: "DeepSeek",
      baseURL: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
    },
    "GPT-5": { 
      keyVar: "LLM_GPT5_API_KEY", 
      provider: "OpenAI",
    },
    "Claude-3.5": { 
      keyVar: "LLM_CLAUDE35_API_KEY", 
      provider: "Anthropic",
    },
    "Grok-4": { 
      keyVar: "LLM_GROK4_API_KEY", 
      provider: "xAI",
      baseURL: "https://api.x.ai/v1",
      model: "grok-3",
    },
    "Gemini-2": { 
      keyVar: "LLM_GEMINI2_API_KEY", 
      provider: "Google",
    },
  };

  const config = envVarMap[agentName];
  if (!config) {
    console.error(`[LLM] Unknown agent: ${agentName}`);
    return null;
  }

  const apiKey = process.env[config.keyVar];
  if (!apiKey) {
    console.error(`[LLM] Missing API key for ${agentName}: ${config.keyVar}`);
    return null;
  }

  switch (config.provider) {
    case "OpenAI":
      return new OpenAIClient(apiKey);
    case "Anthropic":
      return new AnthropicClient(apiKey);
    case "Google":
      return new GeminiClient(apiKey);
    case "DeepSeek":
    case "xAI":
      return new OpenAICompatibleClient(
        apiKey,
        config.baseURL!,
        config.model!,
        config.provider
      );
    default:
      return null;
  }
}
