import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// AI Trading Agents
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  model: text("model").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  apiKeyRef: text("api_key_ref").notNull(),
  apiSecretRef: text("api_secret_ref").notNull(),
  initialCapital: decimal("initial_capital", { precision: 18, scale: 2 }).notNull(),
  currentCapital: decimal("current_capital", { precision: 18, scale: 2 }).notNull(),
  totalPnL: decimal("total_pnl", { precision: 18, scale: 2 }).notNull().default("0"),
  totalPnLPercentage: decimal("total_pnl_percentage", { precision: 10, scale: 2 }).notNull().default("0"),
  sharpeRatio: decimal("sharpe_ratio", { precision: 10, scale: 4 }).notNull().default("0"),
  totalTrades: integer("total_trades").notNull().default(0),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  avatar: text("avatar"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// Trading Positions (Open positions)
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  asset: text("asset").notNull(),
  side: text("side").notNull(),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 18, scale: 2 }).notNull(),
  leverage: integer("leverage").notNull().default(1),
  unrealizedPnL: decimal("unrealized_pnl", { precision: 18, scale: 2 }).notNull().default("0"),
  unrealizedPnLPercentage: decimal("unrealized_pnl_percentage", { precision: 10, scale: 2 }).notNull().default("0"),
  strategy: text("strategy"), // LLM-chosen strategy: momentum, swing, conservative, etc.
  llmReasoning: text("llm_reasoning"), // LLM's reasoning for this trade
  llmConfidence: decimal("llm_confidence", { precision: 3, scale: 2 }), // LLM confidence 0.00-1.00
  openTxHash: text("open_tx_hash").notNull(),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  openedAt: true,
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Trades History (Closed trades)
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  asset: text("asset").notNull(),
  side: text("side").notNull(),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 2 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 18, scale: 2 }).notNull(),
  leverage: integer("leverage").notNull().default(1),
  realizedPnL: decimal("realized_pnl", { precision: 18, scale: 2 }).notNull(),
  realizedPnLPercentage: decimal("realized_pnl_percentage", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(),
  strategy: text("strategy"), // LLM-chosen strategy used for this trade
  llmReasoning: text("llm_reasoning"), // LLM's reasoning for this trade
  llmConfidence: decimal("llm_confidence", { precision: 3, scale: 2 }), // LLM confidence 0.00-1.00
  openTxHash: text("open_tx_hash").notNull(),
  closeTxHash: text("close_tx_hash").notNull(),
  openedAt: timestamp("opened_at").notNull(),
  closedAt: timestamp("closed_at").defaultNow().notNull(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  closedAt: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// Performance Snapshots (Time-series data for charts)
export const performanceSnapshots = pgTable("performance_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  accountValue: decimal("account_value", { precision: 18, scale: 2 }).notNull(),
  totalPnL: decimal("total_pnl", { precision: 18, scale: 2 }).notNull(),
  totalPnLPercentage: decimal("total_pnl_percentage", { precision: 10, scale: 2 }).notNull(),
  openPositions: integer("open_positions").notNull().default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPerformanceSnapshotSchema = createInsertSchema(performanceSnapshots).omit({
  id: true,
});

export type InsertPerformanceSnapshot = z.infer<typeof insertPerformanceSnapshotSchema>;
export type PerformanceSnapshot = typeof performanceSnapshots.$inferSelect;

// Activity Feed Events (For the terminal-style feed)
export const activityEvents = pgTable("activity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  asset: text("asset"),
  strategy: text("strategy"), // Strategy used (if applicable)
  txHash: text("tx_hash"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityEventSchema = createInsertSchema(activityEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;
export type ActivityEvent = typeof activityEvents.$inferSelect;

// AsterDex Orders (Real trading orders)
export const asterdexOrders = pgTable("asterdex_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  asterdexOrderId: text("asterdex_order_id"),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // BUY or SELL
  type: text("type").notNull(), // LIMIT or MARKET
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 2 }),
  status: text("status").notNull().default("PENDING"), // PENDING, FILLED, PARTIALLY_FILLED, CANCELED, REJECTED
  filledQuantity: decimal("filled_quantity", { precision: 18, scale: 8 }).default("0"),
  avgFilledPrice: decimal("avg_filled_price", { precision: 18, scale: 2 }),
  strategy: text("strategy"), // LLM-chosen strategy for this order
  llmReasoning: text("llm_reasoning"), // LLM's reasoning
  llmConfidence: decimal("llm_confidence", { precision: 3, scale: 2 }), // LLM confidence
  action: text("action"), // OPEN or CLOSE (from LLM decision)
  direction: text("direction"), // LONG or SHORT (for OPEN actions)
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAsterdexOrderSchema = createInsertSchema(asterdexOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAsterdexOrder = z.infer<typeof insertAsterdexOrderSchema>;
export type AsterdexOrder = typeof asterdexOrders.$inferSelect;

// Agent Trading Strategies
export const agentStrategies = pgTable("agent_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id).unique(),
  strategyType: text("strategy_type").notNull(), // momentum, swing, conservative, aggressive, trend_follower, mean_reversion
  riskTolerance: text("risk_tolerance").notNull(), // low, medium, high
  maxPositionSizePercent: decimal("max_position_size_percent", { precision: 5, scale: 2 }).notNull().default("30"),
  maxLossPerTradePercent: decimal("max_loss_per_trade_percent", { precision: 5, scale: 2 }).notNull().default("5"),
  tradingPairPreferences: text("trading_pair_preferences").array().notNull(),
  tradeFrequencyMinutes: integer("trade_frequency_minutes").notNull().default(5),
  useStopLoss: boolean("use_stop_loss").notNull().default(true),
  stopLossPercent: decimal("stop_loss_percent", { precision: 5, scale: 2 }).default("3"),
  useTakeProfit: boolean("use_take_profit").notNull().default(true),
  takeProfitPercent: decimal("take_profit_percent", { precision: 5, scale: 2 }).default("10"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentStrategySchema = createInsertSchema(agentStrategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentStrategy = z.infer<typeof insertAgentStrategySchema>;
export type AgentStrategy = typeof agentStrategies.$inferSelect;
