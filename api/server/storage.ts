import {
  type Agent,
  type InsertAgent,
  type Trade,
  type InsertTrade,
  type Position,
  type InsertPosition,
  type PerformanceSnapshot,
  type InsertPerformanceSnapshot,
  type ActivityEvent,
  type InsertActivityEvent,
} from "../../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  // Agent operations
  getAllAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined>;

  // Trade operations
  getAllTrades(): Promise<Trade[]>;
  getTradesByAgent(agentId: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  getRecentTrades(limit: number): Promise<Trade[]>;

  // Position operations
  getAllPositions(): Promise<Position[]>;
  getPositionsByAgent(agentId: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, updates: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<boolean>;

  // Performance snapshot operations
  getPerformanceSnapshots(agentId: string): Promise<PerformanceSnapshot[]>;
  getAllPerformanceSnapshots(): Promise<PerformanceSnapshot[]>;
  createPerformanceSnapshot(snapshot: InsertPerformanceSnapshot): Promise<PerformanceSnapshot>;

  // Activity event operations
  getRecentActivityEvents(limit: number): Promise<ActivityEvent[]>;
  createActivityEvent(event: InsertActivityEvent): Promise<ActivityEvent>;
}

export class MemStorage implements IStorage {
  private agents: Map<string, Agent>;
  private trades: Map<string, Trade>;
  private positions: Map<string, Position>;
  private performanceSnapshots: Map<string, PerformanceSnapshot>;
  private activityEvents: ActivityEvent[];

  constructor() {
    this.agents = new Map();
    this.trades = new Map();
    this.positions = new Map();
    this.performanceSnapshots = new Map();
    this.activityEvents = [];
  }

  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort((a, b) => 
      Number(b.totalPnLPercentage) - Number(a.totalPnLPercentage)
    );
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find((agent) => agent.name === name);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const now = new Date();
    const agent: Agent = {
      id,
      ...insertAgent,
      avatar: insertAgent.avatar ?? null,
      description: insertAgent.description ?? null,
      totalPnL: insertAgent.totalPnL ?? "0",
      totalPnLPercentage: insertAgent.totalPnLPercentage ?? "0",
      sharpeRatio: insertAgent.sharpeRatio ?? "0",
      totalTrades: insertAgent.totalTrades ?? 0,
      winRate: insertAgent.winRate ?? "0",
      isActive: insertAgent.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const existing = this.agents.get(id);
    if (!existing) return undefined;

    const updated: Agent = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.agents.set(id, updated);
    return updated;
  }

  // Trade operations
  async getAllTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values()).sort(
      (a, b) => b.closedAt.getTime() - a.closedAt.getTime()
    );
  }

  async getTradesByAgent(agentId: string): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter((trade) => trade.agentId === agentId)
      .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const now = new Date();
    const trade: Trade = {
      id,
      ...insertTrade,
      leverage: insertTrade.leverage ?? 1,
      strategy: insertTrade.strategy ?? null,
      llmReasoning: insertTrade.llmReasoning ?? null,
      llmConfidence: insertTrade.llmConfidence ?? null,
      closedAt: now,
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getRecentTrades(limit: number): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime())
      .slice(0, limit);
  }

  // Position operations
  async getAllPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async getPositionsByAgent(agentId: string): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(
      (position) => position.agentId === agentId
    );
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const id = randomUUID();
    const now = new Date();
    const position: Position = {
      id,
      ...insertPosition,
      leverage: insertPosition.leverage ?? 1,
      unrealizedPnL: insertPosition.unrealizedPnL ?? "0",
      unrealizedPnLPercentage: insertPosition.unrealizedPnLPercentage ?? "0",
      strategy: insertPosition.strategy ?? null,
      llmReasoning: insertPosition.llmReasoning ?? null,
      llmConfidence: insertPosition.llmConfidence ?? null,
      openedAt: now,
    };
    this.positions.set(id, position);
    return position;
  }

  async updatePosition(
    id: string,
    updates: Partial<InsertPosition>
  ): Promise<Position | undefined> {
    const existing = this.positions.get(id);
    if (!existing) return undefined;

    const updated: Position = {
      ...existing,
      ...updates,
      id: existing.id,
    };
    this.positions.set(id, updated);
    return updated;
  }

  async deletePosition(id: string): Promise<boolean> {
    return this.positions.delete(id);
  }

  // Performance snapshot operations
  async getPerformanceSnapshots(agentId: string): Promise<PerformanceSnapshot[]> {
    return Array.from(this.performanceSnapshots.values())
      .filter((snapshot) => snapshot.agentId === agentId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getAllPerformanceSnapshots(): Promise<PerformanceSnapshot[]> {
    return Array.from(this.performanceSnapshots.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  async createPerformanceSnapshot(
    insertSnapshot: InsertPerformanceSnapshot
  ): Promise<PerformanceSnapshot> {
    const id = randomUUID();
    const now = new Date();
    const snapshot: PerformanceSnapshot = {
      id,
      ...insertSnapshot,
      openPositions: insertSnapshot.openPositions ?? 0,
      timestamp: insertSnapshot.timestamp ?? now,
    };
    this.performanceSnapshots.set(id, snapshot);
    return snapshot;
  }

  // Activity event operations
  async getRecentActivityEvents(limit: number): Promise<ActivityEvent[]> {
    return this.activityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivityEvent(insertEvent: InsertActivityEvent): Promise<ActivityEvent> {
    const id = randomUUID();
    const now = new Date();
    const event: ActivityEvent = {
      id,
      ...insertEvent,
      asset: insertEvent.asset ?? null,
      strategy: insertEvent.strategy ?? null,
      txHash: insertEvent.txHash ?? null,
      timestamp: now,
    };
    this.activityEvents.push(event);
    
    if (this.activityEvents.length > 1000) {
      this.activityEvents = this.activityEvents.slice(-500);
    }
    
    return event;
  }
}

export const storage = new MemStorage();
