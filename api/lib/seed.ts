import { db } from "./db.js";
import { agents, agentStrategies, performanceSnapshots, activityEvents } from "./schema.js";
import { eq, sql } from "drizzle-orm";

const agentConfigs = [
  {
    name: "DeepSeek-R1",
    model: "DeepSeek R1",
    avatar: "eye",
    description: "Analytical reasoner with momentum-based trading strategy",
    apiKeyRef: "AGENT_DEEPSEEK_API_KEY",
    apiSecretRef: "AGENT_DEEPSEEK_API_SECRET",
    strategyType: "momentum",
    riskTolerance: "medium",
    tradingPairs: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    maxPositionSize: "25",
    maxLossPerTrade: "4",
  },
  {
    name: "GPT-5",
    model: "GPT-5 Turbo",
    avatar: "brain",
    description: "Advanced swing trader with market sentiment analysis",
    apiKeyRef: "AGENT_GPT5_API_KEY",
    apiSecretRef: "AGENT_GPT5_API_SECRET",
    strategyType: "swing",
    riskTolerance: "medium",
    tradingPairs: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    maxPositionSize: "30",
    maxLossPerTrade: "5",
  },
  {
    name: "Claude-3.5",
    model: "Claude 3.5 Sonnet",
    avatar: "target",
    description: "Conservative trader focused on capital preservation",
    apiKeyRef: "AGENT_CLAUDE35_API_KEY",
    apiSecretRef: "AGENT_CLAUDE35_API_SECRET",
    strategyType: "conservative",
    riskTolerance: "low",
    tradingPairs: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    maxPositionSize: "20",
    maxLossPerTrade: "3",
  },
  {
    name: "Grok-4",
    model: "Grok 4",
    avatar: "zap",
    description: "Aggressive high-risk trader seeking maximum gains",
    apiKeyRef: "AGENT_GROK4_API_KEY",
    apiSecretRef: "AGENT_GROK4_API_SECRET",
    strategyType: "aggressive",
    riskTolerance: "high",
    tradingPairs: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    maxPositionSize: "40",
    maxLossPerTrade: "8",
  },
  {
    name: "Gemini-2",
    model: "Gemini 2.0 Ultra",
    avatar: "sparkles",
    description: "Mean reversion specialist leveraging multi-modal data",
    apiKeyRef: "AGENT_GEMINI2_API_KEY",
    apiSecretRef: "AGENT_GEMINI2_API_SECRET",
    strategyType: "mean_reversion",
    riskTolerance: "medium",
    tradingPairs: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    maxPositionSize: "30",
    maxLossPerTrade: "5",
  },
];

function generateWalletAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

export async function seedDatabase() {
  console.log("🌱 Initializing AEGIS Arena with live trading setup...");

  const existingAgents = await db.select().from(agents);
  if (existingAgents.length > 0) {
    console.log("✅ Database already initialized with agents");
    return;
  }

  const initialCapital = "20.00";
  console.log(`💰 Each agent starts with $${initialCapital} in initial capital`);

  for (const config of agentConfigs) {
    const [agent] = await db
      .insert(agents)
      .values({
        name: config.name,
        model: config.model,
        walletAddress: generateWalletAddress(),
        apiKeyRef: config.apiKeyRef,
        apiSecretRef: config.apiSecretRef,
        initialCapital: initialCapital,
        currentCapital: initialCapital,
        totalPnL: "0",
        totalPnLPercentage: "0",
        sharpeRatio: "0",
        totalTrades: 0,
        winRate: "0",
        avatar: config.avatar,
        description: config.description,
        isActive: true,
      })
      .returning();

    await db.insert(agentStrategies).values({
      agentId: agent.id,
      strategyType: config.strategyType,
      riskTolerance: config.riskTolerance,
      maxPositionSizePercent: config.maxPositionSize,
      maxLossPerTradePercent: config.maxLossPerTrade,
      tradingPairPreferences: sql`ARRAY[${sql.join(
        config.tradingPairs.map((pair) => sql`${pair}`),
        sql`, `
      )}]`,
      tradeFrequencyMinutes: 2,
      useStopLoss: true,
      stopLossPercent: config.maxLossPerTrade,
      useTakeProfit: true,
      takeProfitPercent: "15",
    });

    await db.insert(performanceSnapshots).values({
      agentId: agent.id,
      accountValue: initialCapital,
      totalPnL: "0",
      totalPnLPercentage: "0",
      openPositions: 0,
    });

    await db.insert(activityEvents).values({
      agentId: agent.id,
      eventType: "AGENT_INITIALIZED",
      message: `${config.name} initialized with ${config.strategyType} strategy and $${initialCapital} capital`,
    });

    console.log(`✓ Initialized ${config.name} (${config.strategyType} strategy)`);
  }

  console.log("🚀 AEGIS Arena ready for live trading!");
}
