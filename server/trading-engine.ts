import { db } from "./db";
import { agents, asterdexOrders, agentStrategies, activityEvents, performanceSnapshots } from "@shared/schema";
import { AsterDexClient } from "./asterdex-client";
import { type MarketData } from "./trading-strategies";
import { getLLMClientForAgent, type LLMAnalysisContext, type SupportedCrypto, SUPPORTED_CRYPTOS } from "./llm-clients";
import { tradingValidator, type ValidationContext } from "./trading-validators";
import { eq } from "drizzle-orm";

export class TradingEngine {
  private isRunning: boolean = false;
  private agentClients: Map<string, AsterDexClient> = new Map();

  constructor() {
    // Clients are now created per-agent on demand
  }

  async start() {
    if (this.isRunning) {
      console.log("Trading engine is already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Trading Engine Started - Live Trading Active");

    // Run trading cycle every 2 minutes
    this.runTradingCycle();
    setInterval(() => this.runTradingCycle(), 2 * 60 * 1000);
  }

  stop() {
    this.isRunning = false;
    console.log("🛑 Trading Engine Stopped");
  }

  private getAgentClient(agent: any): AsterDexClient | null {
    if (!this.agentClients.has(agent.id)) {
      const apiKey = process.env[agent.apiKeyRef];
      const apiSecret = process.env[agent.apiSecretRef];

      if (!apiKey || !apiSecret) {
        console.log(`⚠️  Missing API credentials for ${agent.name} - skipping real trading`);
        return null;
      }

      const client = new AsterDexClient({
        apiKey,
        apiSecret,
        baseURL: "https://fapi.asterdex.com",
      });
      this.agentClients.set(agent.id, client);
    }

    return this.agentClients.get(agent.id)!;
  }

  private async runTradingCycle() {
    try {
      console.log("⚡ Running Trading Cycle...");

      const allAgents = await db.select().from(agents).where(eq(agents.isActive, true));
      const allStrategies = await db.select().from(agentStrategies);

      if (allAgents.length === 0) {
        console.log("No active agents found");
        return;
      }

      // Try to fetch market data - fallback to CryptoCompare if no AsterDex client
      const firstClient = this.getAgentClient(allAgents[0]);
      const marketData = await this.fetchMarketData(firstClient);

      if (marketData.length === 0) {
        console.log("⚠️  No market data available, skipping trading cycle");
        return;
      }

      for (const agent of allAgents) {
        try {
          await this.executeAgentTrades(agent, allStrategies, marketData);
        } catch (error) {
          console.error(`Error executing trades for agent ${agent.name}:`, error);
        }
      }

      // Update agent balances from actual trades
      await this.updateAgentBalances();

      console.log("✅ Trading Cycle Complete");
    } catch (error) {
      console.error("Trading cycle error:", error);
    }
  }

  private async fetchMarketData(client: AsterDexClient | null): Promise<(MarketData & { symbol: SupportedCrypto })[]> {
    // Map supported cryptos to AsterDex symbols
    const symbolMap: Record<SupportedCrypto, string> = {
      SOL: "SOLUSDT",
      ETH: "ETHUSDT",
      BTC: "BTCUSDT",
      BNB: "BNBUSDT",
      DOGE: "DOGEUSDT",
    };

    const marketData: (MarketData & { symbol: SupportedCrypto })[] = [];

    // If no AsterDex client, use CryptoCompare as fallback
    if (!client) {
      return this.fetchMarketDataFromCryptoCompare();
    }

    for (const crypto of SUPPORTED_CRYPTOS) {
      try {
        const asterdexSymbol = symbolMap[crypto];
        const stats = await client.get24hrStats(asterdexSymbol);
        marketData.push({
          symbol: crypto, // Use our normalized symbol (SOL, ETH, etc.)
          currentPrice: parseFloat(stats.lastPrice),
          change24h: parseFloat(stats.priceChangePercent),
          volume24h: parseFloat(stats.volume),
          high24h: parseFloat(stats.highPrice),
          low24h: parseFloat(stats.lowPrice),
        });
      } catch (error) {
        console.error(`Failed to fetch data for ${crypto}:`, error);
      }
    }

    return marketData;
  }

  private async fetchMarketDataFromCryptoCompare(): Promise<(MarketData & { symbol: SupportedCrypto })[]> {
    const marketData: (MarketData & { symbol: SupportedCrypto })[] = [];
    
    try {
      const symbols = ['SOL', 'ETH', 'BTC', 'BNB', 'DOGE'];
      const fsyms = symbols.join(',');
      
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=USD`
      );
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      for (const symbol of symbols) {
        const raw = data.RAW?.[symbol]?.USD;
        if (raw) {
          marketData.push({
            symbol: symbol as SupportedCrypto,
            currentPrice: raw.PRICE || 0,
            change24h: raw.CHANGEPCT24HOUR || 0,
            volume24h: raw.TOTALVOLUME24H || 0,
            high24h: raw.HIGH24HOUR || raw.PRICE || 0,
            low24h: raw.LOW24HOUR || raw.PRICE || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch data from CryptoCompare:', error);
    }

    return marketData;
  }

  private async loadCurrentPositions(agentId: string): Promise<Map<string, number>> {
    const positions = new Map<string, number>();

    try {
      // Fetch all filled orders for this agent
      const orders = await db
        .select()
        .from(asterdexOrders)
        .where(eq(asterdexOrders.agentId, agentId));

      // Calculate net position for each symbol
      for (const order of orders) {
        if (order.status === "FILLED" && order.filledQuantity) {
          // Normalize symbol: SOLUSDT → SOL, ETHUSDT → ETH, etc.
          const normalizedSymbol = order.symbol.replace("USDT", "") as SupportedCrypto;
          const quantity = parseFloat(order.filledQuantity);
          const currentPosition = positions.get(normalizedSymbol) || 0;

          if (order.side === "BUY") {
            positions.set(normalizedSymbol, currentPosition + quantity);
          } else if (order.side === "SELL") {
            positions.set(normalizedSymbol, currentPosition - quantity);
          }
        }
      }

      // Remove zero or negative positions
      for (const [symbol, qty] of Array.from(positions.entries())) {
        if (qty <= 0.000001) {
          positions.delete(symbol);
        }
      }
    } catch (error) {
      console.error(`Failed to load positions for agent ${agentId}:`, error);
    }

    return positions;
  }

  private normalizePrecision(symbol: string, quantity: number): number {
    // Define precision rules based on asset type - being conservative for AsterDex
    let decimals = 2; // Very conservative default

    if (symbol.startsWith("DOGE")) {
      decimals = 0; // DOGE uses whole numbers
    } else if (symbol.startsWith("BTC")) {
      decimals = 4; // BTC - conservative precision
    } else if (symbol.startsWith("ETH")) {
      decimals = 3; // ETH - conservative precision
    } else if (symbol.startsWith("BNB")) {
      decimals = 2; // BNB - very conservative precision
    }

    // Round to specified decimals
    const multiplier = Math.pow(10, decimals);
    return Math.floor(quantity * multiplier) / multiplier;
  }

  private async executeAgentTrades(
    agent: any,
    allStrategies: any[],
    marketData: (MarketData & { symbol: SupportedCrypto })[]
  ) {
    console.log(`\n🤖 ${agent.name} - Consulting AI for trading decision...`);

    // Get LLM client for this agent
    const llmClient = getLLMClientForAgent(agent.name);
    if (!llmClient) {
      console.log(`⚠️  No LLM client configured for ${agent.name}`);
      return;
    }

    // Get agent's current positions
    const currentPositions = await this.loadCurrentPositions(agent.id);
    
    // Convert positions map to array for LLM context
    const openPositions = Array.from(currentPositions.entries()).map(([asset, size]) => {
      const marketInfo = marketData.find((m) => m.symbol === asset || m.symbol === asset.replace("USDT", ""));
      const currentPrice = marketInfo?.currentPrice || 0;
      const entryPrice = currentPrice; // Simplified - should track actual entry price
      
      return {
        asset,
        size,
        entryPrice,
        currentPrice,
        unrealizedPnL: (currentPrice - entryPrice) * size,
      };
    });

    // Get recent trade count for this cycle
    const recentOrders = await db
      .select()
      .from(asterdexOrders)
      .where(eq(asterdexOrders.agentId, agent.id));
    
    const now = new Date();
    const cycleStart = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
    const recentTrades = recentOrders.filter(
      (o) => new Date(o.createdAt) >= cycleStart
    ).length;

    // Prepare LLM analysis context
    const llmContext: LLMAnalysisContext = {
      agentName: agent.name,
      currentCapital: parseFloat(agent.currentCapital),
      openPositions,
      marketData,
    };

    try {
      // Consult LLM for trading decision
      const decision = await llmClient.analyzeMarket(llmContext);
      
      console.log(`💭 ${agent.name} Decision:`);
      console.log(`   Action: ${decision.action}`);
      console.log(`   Asset: ${decision.asset || "N/A"}`);
      console.log(`   Strategy: ${decision.strategy || "N/A"}`);
      console.log(`   Position Size: ${decision.positionSizePercent}%`);
      console.log(`   Confidence: ${(decision.confidence * 100).toFixed(0)}%`);
      console.log(`   Reasoning: ${decision.reasoning}`);

      // If decision is HOLD, skip
      if (decision.action === "HOLD") {
        console.log(`✋ ${agent.name} decided to HOLD`);
        return;
      }

      // Validate decision with algorithmic rules
      const validationContext: ValidationContext = {
        agentCapital: parseFloat(agent.currentCapital),
        openPositions: openPositions.map((p) => ({
          asset: p.asset,
          size: p.size,
          entryPrice: p.entryPrice,
        })),
        marketData,
        recentTrades,
      };

      const validation = tradingValidator.validate(decision, validationContext);

      if (!validation.isValid) {
        console.log(`❌ ${agent.name} decision rejected: ${validation.reason}`);
        
        // Log rejected decision
        await db.insert(activityEvents).values({
          agentId: agent.id,
          eventType: "DECISION_REJECTED",
          message: `Decision rejected: ${validation.reason}`,
          asset: decision.asset || undefined,
          strategy: decision.strategy || undefined,
        });
        
        return;
      }

      // Apply any adjustments from validation
      const finalDecision = {
        ...decision,
        ...validation.adjustedDecision,
      };

      if (validation.adjustedDecision) {
        console.log(`⚙️  Decision adjusted by validator`);
      }

      // Execute the validated trade
      await this.executeLLMTrade(agent, finalDecision, marketData);
    } catch (error) {
      console.error(`Error getting LLM decision for ${agent.name}:`, error);
    }
  }

  private async executeLLMTrade(
    agent: any,
    decision: any,
    marketData: (MarketData & { symbol: SupportedCrypto })[]
  ) {
    const asset = decision.asset;
    if (!asset) return;

    // Map normalized symbol (SOL, ETH, etc.) to AsterDex symbol (SOLUSDT, ETHUSDT, etc.)
    const symbolMap: Record<SupportedCrypto, string> = {
      SOL: "SOLUSDT",
      ETH: "ETHUSDT",
      BTC: "BTCUSDT",
      BNB: "BNBUSDT",
      DOGE: "DOGEUSDT",
    };

    const asterdexSymbol = symbolMap[asset as SupportedCrypto];
    const marketInfo = marketData.find((m) => m.symbol === asset);
    const marketPrice = marketInfo?.currentPrice || 0;

    if (!marketPrice) {
      console.log(`⚠️  No market price available for ${asset}`);
      return;
    }

    // Calculate trade quantity based on position size percentage
    const agentCapital = parseFloat(agent.currentCapital);
    const tradeValue = (agentCapital * decision.positionSizePercent) / 100;
    let quantity = tradeValue / marketPrice;

    // For SELL, get actual position size
    if (decision.action === "SELL") {
      const currentPositions = await this.loadCurrentPositions(agent.id);
      const position = currentPositions.get(asset) || 0; // Use normalized symbol (SOL, ETH, etc.)
      quantity = position; // Sell entire position
    }

    // Normalize quantity precision
    let normalizedQuantity = this.normalizePrecision(asterdexSymbol, quantity);

    if (normalizedQuantity <= 0) {
      console.log(`⚠️  Normalized quantity is too small for ${asset}`);
      return;
    }

    // For BUY orders, ensure notional (quantity * price) meets minimum $5 requirement
    // After normalization, the notional might be less than $5 due to rounding down
    if (decision.action === "BUY") {
      const MIN_NOTIONAL = 5.0;
      let notional = normalizedQuantity * marketPrice;
      
      // If notional is below minimum, increase quantity by one precision step
      if (notional < MIN_NOTIONAL) {
        // Get precision step (e.g., 0.01 for 2 decimals, 1 for 0 decimals)
        let decimals = 2;
        if (asterdexSymbol.startsWith("DOGE")) {
          decimals = 0;
        } else if (asterdexSymbol.startsWith("BTC")) {
          decimals = 4;
        } else if (asterdexSymbol.startsWith("ETH")) {
          decimals = 3;
        } else if (asterdexSymbol.startsWith("BNB")) {
          decimals = 2;
        }
        const precisionStep = Math.pow(10, -decimals);
        
        // Increase quantity until notional >= $5
        while (notional < MIN_NOTIONAL && normalizedQuantity < quantity * 1.1) {
          normalizedQuantity += precisionStep;
          normalizedQuantity = this.normalizePrecision(asterdexSymbol, normalizedQuantity);
          notional = normalizedQuantity * marketPrice;
        }
        
        // Final check: if still below minimum, reject
        if (notional < MIN_NOTIONAL) {
          console.log(`⚠️  ${agent.name}: Cannot meet minimum notional $${MIN_NOTIONAL}. Calculated: $${notional.toFixed(2)}`);
          return;
        }
        
        console.log(`⚙️  Adjusted quantity to meet minimum notional: ${normalizedQuantity} ${asset} = $${notional.toFixed(2)}`);
      }
    }

    console.log(
      `🤖 ${agent.name} - ${decision.action} ${normalizedQuantity} ${asset} using ${decision.strategy} strategy`
    );

    // Create order in database with LLM decision metadata
    const [order] = await db
      .insert(asterdexOrders)
      .values({
        agentId: agent.id,
        symbol: asterdexSymbol,
        side: decision.action,
        type: "MARKET",
        quantity: normalizedQuantity.toString(),
        status: "PENDING",
        strategy: decision.strategy,
        llmReasoning: decision.reasoning,
        llmConfidence: decision.confidence.toString(),
      })
      .returning();

    try {
      // Get agent's individual AsterDex client
      const agentClient = this.getAgentClient(agent);
      
      if (!agentClient) {
        console.log(`⚠️  ${agent.name} cannot execute trade - no AsterDex credentials configured`);
        await db
          .update(asterdexOrders)
          .set({
            status: "REJECTED",
            updatedAt: new Date(),
          })
          .where(eq(asterdexOrders.id, order.id));
        return;
      }

      // Execute order on AsterDex with agent's credentials
      const orderResponse = await agentClient.createOrder({
        symbol: asterdexSymbol,
        side: decision.action,
        type: "MARKET",
        quantity: normalizedQuantity,
      });

      // Update order with response
      await db
        .update(asterdexOrders)
        .set({
          asterdexOrderId: orderResponse.orderId,
          status: orderResponse.status,
          filledQuantity: orderResponse.executedQty,
          avgFilledPrice: orderResponse.avgPrice,
          txHash: orderResponse.txHash,
          updatedAt: new Date(),
        })
        .where(eq(asterdexOrders.id, order.id));

      // Log activity with strategy info
      await db.insert(activityEvents).values({
        agentId: agent.id,
        eventType: decision.action === "BUY" ? "POSITION_OPENED" : "POSITION_CLOSED",
        message: `${decision.action} ${normalizedQuantity.toFixed(6)} ${asset} using ${decision.strategy} - ${decision.reasoning}`,
        asset,
        strategy: decision.strategy,
        txHash: orderResponse.txHash,
      });

      console.log(`✅ Order executed for ${agent.name}: ${orderResponse.orderId}`);
    } catch (error: any) {
      console.error(`❌ Order failed for ${agent.name}:`, error.message);

      // Mark order as REJECTED in database
      await db
        .update(asterdexOrders)
        .set({
          status: "REJECTED",
          updatedAt: new Date(),
        })
        .where(eq(asterdexOrders.id, order.id));

      // Log failed order
      await db.insert(activityEvents).values({
        agentId: agent.id,
        eventType: "TRADE_ERROR",
        message: `Failed to ${decision.action} ${asset}: ${error.message}`,
        asset,
        strategy: decision.strategy,
      });
    }
  }

  // Legacy method kept for potential fallback use
  private async executeTrade(agent: any, signal: any, strategy: any, marketData: MarketData[]) {
    console.log(
      `🤖 ${agent.name} - ${signal.action} ${signal.symbol} | Confidence: ${(signal.confidence * 100).toFixed(0)}%`
    );

    // Load current positions to enforce risk limits
    const currentPositions = await this.loadCurrentPositions(agent.id);
    const currentPosition = currentPositions.get(signal.symbol) || 0;

    // Get current market price for this symbol
    const marketInfo = marketData.find((m) => m.symbol === signal.symbol);
    const marketPrice = marketInfo?.currentPrice || 0;

    if (!marketPrice) {
      console.log(`⚠️  No market price available for ${signal.symbol}`);
      return;
    }

    // Risk management checks
    const agentCapital = parseFloat(agent.currentCapital);
    const maxLossPerTrade = agentCapital * (parseFloat(strategy.maxLossPerTradePercent) / 100);
    const maxPositionSize = agentCapital * (parseFloat(strategy.maxPositionSizePercent) / 100);

    // Calculate actual trade value using market price
    const tradeValue = signal.quantity ? signal.quantity * marketPrice : 0;

    // Check max loss per trade (5% limit - strict enforcement)
    if (tradeValue > maxLossPerTrade) {
      console.log(`⚠️  Trade value $${tradeValue.toFixed(2)} exceeds max loss limit $${maxLossPerTrade.toFixed(2)} (5%) for ${agent.name}`);
      return;
    }

    // Check max position size (only for BUY orders - 30% limit)
    if (signal.action === "BUY") {
      const potentialPosition = currentPosition + (signal.quantity || 0);
      const potentialValue = potentialPosition * marketPrice;

      if (potentialValue > maxPositionSize) {
        console.log(`⚠️  Position value $${potentialValue.toFixed(2)} would exceed max position size $${maxPositionSize.toFixed(2)} for ${agent.name} in ${signal.symbol}`);
        return;
      }
    }

    // Check if selling more than owned
    if (signal.action === "SELL" && signal.quantity && signal.quantity > currentPosition) {
      console.log(`⚠️  Cannot sell ${signal.quantity} ${signal.symbol} - only holding ${currentPosition}`);
      return;
    }

    // Normalize quantity precision for AsterDex
    // BNB/BTC/ETH typically use 4-6 decimals, DOGE uses 0-2 decimals
    const normalizedQuantity = this.normalizePrecision(signal.symbol, signal.quantity || 0);

    if (normalizedQuantity <= 0) {
      console.log(`⚠️  Normalized quantity is too small for ${signal.symbol}`);
      return;
    }

    // Create order in database first (before try block to track it)
    const [order] = await db
      .insert(asterdexOrders)
      .values({
        agentId: agent.id,
        symbol: signal.symbol,
        side: signal.action,
        type: "MARKET",
        quantity: normalizedQuantity.toString(),
        status: "PENDING",
      })
      .returning();

    try {
      // Get agent's individual AsterDex client
      const agentClient = this.getAgentClient(agent);
      
      if (!agentClient) {
        console.log(`⚠️  ${agent.name} cannot execute trade - no AsterDex credentials configured`);
        await db
          .update(asterdexOrders)
          .set({
            status: "REJECTED",
            updatedAt: new Date(),
          })
          .where(eq(asterdexOrders.id, order.id));
        return;
      }

      // Execute order on AsterDex with agent's credentials
      const orderResponse = await agentClient.createOrder({
        symbol: signal.symbol,
        side: signal.action,
        type: "MARKET",
        quantity: normalizedQuantity,
      });

      // Update order with response
      await db
        .update(asterdexOrders)
        .set({
          asterdexOrderId: orderResponse.orderId,
          status: orderResponse.status,
          filledQuantity: orderResponse.executedQty,
          avgFilledPrice: orderResponse.avgPrice,
          txHash: orderResponse.txHash,
          updatedAt: new Date(),
        })
        .where(eq(asterdexOrders.id, order.id));

      // Log activity
      await db.insert(activityEvents).values({
        agentId: agent.id,
        eventType: signal.action === "BUY" ? "POSITION_OPENED" : "POSITION_CLOSED",
        message: `${signal.action} ${signal.quantity?.toFixed(6)} ${signal.symbol} - ${signal.reason}`,
        asset: signal.symbol,
        txHash: orderResponse.txHash,
      });

      console.log(`✅ Order executed for ${agent.name}: ${orderResponse.orderId}`);
    } catch (error: any) {
      console.error(`❌ Order failed for ${agent.name}:`, error.message);

      // Mark order as REJECTED in database
      await db
        .update(asterdexOrders)
        .set({
          status: "REJECTED",
          updatedAt: new Date(),
        })
        .where(eq(asterdexOrders.id, order.id));

      // Log failed order
      await db.insert(activityEvents).values({
        agentId: agent.id,
        eventType: "TRADE_ERROR",
        message: `Failed to ${signal.action} ${signal.symbol}: ${error.message}`,
        asset: signal.symbol,
      });
    }
  }

  async updateAgentBalances() {
    try {
      const allAgents = await db.select().from(agents);

      for (const agent of allAgents) {
        try {
          const agentClient = this.getAgentClient(agent);
          let currentBalance = parseFloat(agent.initialCapital);

          // Try to get real balance from AsterDex
          if (agentClient) {
            try {
              const balances = await agentClient.getAccount();
              // Find USDT or USDC balance (the quote currency)
              const usdtBalance = balances.find((b) => b.asset === "USDT" || b.asset === "USDC");
              // AsterDex returns availableBalance or walletBalance, not free
              const balanceValue = usdtBalance?.availableBalance || usdtBalance?.walletBalance || usdtBalance?.free || "0";
              if (usdtBalance && parseFloat(balanceValue) >= 0) {
                currentBalance = parseFloat(balanceValue);
                console.log(`💰 ${agent.name}: Balance updated from AsterDex: $${currentBalance.toFixed(2)}`);
              }
            } catch (error) {
              console.log(`⚠️  Could not fetch balance for ${agent.name} from AsterDex`);
            }
          }

          // Fallback: Calculate current balance based on executed trades
          if (!agentClient || currentBalance === parseFloat(agent.initialCapital)) {
            const orders = await db
              .select()
              .from(asterdexOrders)
              .where(eq(asterdexOrders.agentId, agent.id));

            for (const order of orders) {
              if (order.status === "FILLED" && order.avgFilledPrice && order.filledQuantity) {
                const tradeValue = parseFloat(order.avgFilledPrice) * parseFloat(order.filledQuantity);
                
                if (order.side === "BUY") {
                  currentBalance -= tradeValue;
                } else {
                  currentBalance += tradeValue;
                }
              }
            }
          }

          // Update agent
          await db
            .update(agents)
            .set({
              currentCapital: currentBalance.toFixed(2),
              totalPnL: (currentBalance - parseFloat(agent.initialCapital)).toFixed(2),
              totalPnLPercentage: (
                ((currentBalance - parseFloat(agent.initialCapital)) / parseFloat(agent.initialCapital)) *
                100
              ).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(agents.id, agent.id));

          // Create performance snapshot
          await db.insert(performanceSnapshots).values({
            agentId: agent.id,
            accountValue: currentBalance.toFixed(2),
            totalPnL: (currentBalance - parseFloat(agent.initialCapital)).toFixed(2),
            totalPnLPercentage: (
              ((currentBalance - parseFloat(agent.initialCapital)) / parseFloat(agent.initialCapital)) *
              100
            ).toFixed(2),
            openPositions: 0, // TODO: Calculate from positions
          });
        } catch (error) {
          console.error(`Error updating balance for ${agent.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Error updating agent balances:", error);
    }
  }
}

let tradingEngineInstance: TradingEngine | null = null;

export function getTradingEngine(): TradingEngine {
  if (!tradingEngineInstance) {
    tradingEngineInstance = new TradingEngine();
  }
  return tradingEngineInstance;
}
