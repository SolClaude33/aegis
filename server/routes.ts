import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  agents,
  trades,
  positions,
  performanceSnapshots,
  activityEvents,
  asterdexOrders,
  agentStrategies,
  insertAgentSchema,
  insertTradeSchema,
  insertPositionSchema,
  insertPerformanceSnapshotSchema,
  insertActivityEventSchema,
} from "@shared/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

// Middleware to authenticate trading control endpoints
function requireTradingAuth(req: any, res: any, next: any) {
  // Express normalizes headers to lowercase, so check both cases
  const apiKey = (req.headers['x-trading-api-key'] || req.headers['X-Trading-API-Key'] || req.query.apiKey || '').toString().trim();
  const secretKey = (process.env.TRADING_CONTROL_API_KEY || '').trim();

  if (!secretKey) {
    console.error('⚠️  TRADING_CONTROL_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'Trading control authentication not configured' });
  }

  // Debug logging (remove in production if sensitive)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔐 Auth check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length,
      secretKeyLength: secretKey.length,
      match: apiKey === secretKey,
      headers: Object.keys(req.headers).filter(k => k.toLowerCase().includes('trading'))
    });
  }

  if (!apiKey || apiKey !== secretKey) {
    console.log('❌ Auth failed:', {
      providedLength: apiKey.length,
      expectedLength: secretKey.length,
      firstCharsMatch: apiKey.substring(0, 4) === secretKey.substring(0, 4)
    });
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  console.log('✅ Auth successful');
  next();
}

export async function registerRoutes(app: Express): Promise<Server | void> {
  // Agent Routes
  
  // Get all agents (leaderboard)
  app.get('/api/agents', async (req, res) => {
    try {
      const allAgents = await db.select().from(agents);
      res.json(allAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Get single agent
  app.get('/api/agents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json(agent);
    } catch (error) {
      console.error('Error fetching agent:', error);
      res.status(500).json({ error: 'Failed to fetch agent' });
    }
  });

  // Create agent (for simulation/testing)
  app.post('/api/agents', async (req, res) => {
    try {
      const result = insertAgentSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [agent] = await db.insert(agents).values(result.data).returning();
      res.status(201).json(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  // Update agent stats
  app.patch('/api/agents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertAgentSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [agent] = await db.update(agents)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(agents.id, id))
        .returning();
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json(agent);
    } catch (error) {
      console.error('Error updating agent:', error);
      res.status(500).json({ error: 'Failed to update agent' });
    }
  });

  // Get live trading stats for an agent
  app.get('/api/agents/:id/trading-stats', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get agent data
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      // Get open positions count and total unrealized PnL
      const openPositions = await db.select().from(positions).where(eq(positions.agentId, id));
      
      const totalUnrealizedPnL = openPositions.reduce((sum, pos) => {
        return sum + parseFloat(pos.unrealizedPnL || '0');
      }, 0);
      
      // Get recent trades (last 10)
      const recentTrades = await db.select()
        .from(trades)
        .where(eq(trades.agentId, id))
        .orderBy(desc(trades.closedAt))
        .limit(10);
      
      // Get active orders
      const activeOrders = await db.select()
        .from(asterdexOrders)
        .where(and(
          eq(asterdexOrders.agentId, id),
          inArray(asterdexOrders.status, ['PENDING', 'PARTIALLY_FILLED'])
        ))
        .orderBy(desc(asterdexOrders.createdAt));
      
      res.json({
        agent: {
          id: agent.id,
          name: agent.name,
          currentCapital: agent.currentCapital,
          totalPnL: agent.totalPnL,
          totalPnLPercentage: agent.totalPnLPercentage,
          sharpeRatio: agent.sharpeRatio,
          totalTrades: agent.totalTrades,
          winRate: agent.winRate,
        },
        openPositionsCount: openPositions.length,
        totalUnrealizedPnL,
        openPositions,
        recentTrades,
        activeOrders,
      });
    } catch (error) {
      console.error('Error fetching trading stats:', error);
      res.status(500).json({ error: 'Failed to fetch trading stats' });
    }
  });

  // Trade Routes
  
  // Get all trades
  app.get('/api/trades', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const allTrades = await db.select()
        .from(trades)
        .orderBy(desc(trades.closedAt))
        .limit(limit);
      res.json(allTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  });

  // Get trades for specific agent
  app.get('/api/trades/agent/:agentId', async (req, res) => {
    try {
      const { agentId } = req.params;
      const agentTrades = await db.select()
        .from(trades)
        .where(eq(trades.agentId, agentId))
        .orderBy(desc(trades.closedAt));
      res.json(agentTrades);
    } catch (error) {
      console.error('Error fetching agent trades:', error);
      res.status(500).json({ error: 'Failed to fetch agent trades' });
    }
  });

  // Create trade
  app.post('/api/trades', async (req, res) => {
    try {
      const result = insertTradeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [trade] = await db.insert(trades).values(result.data).returning();
      res.status(201).json(trade);
    } catch (error) {
      console.error('Error creating trade:', error);
      res.status(500).json({ error: 'Failed to create trade' });
    }
  });

  // Position Routes
  
  // Get all positions
  app.get('/api/positions', async (req, res) => {
    try {
      const allPositions = await db.select().from(positions);
      res.json(allPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  });

  // Get positions for specific agent
  app.get('/api/positions/agent/:agentId', async (req, res) => {
    try {
      const { agentId } = req.params;
      const agentPositions = await db.select()
        .from(positions)
        .where(eq(positions.agentId, agentId));
      res.json(agentPositions);
    } catch (error) {
      console.error('Error fetching agent positions:', error);
      res.status(500).json({ error: 'Failed to fetch agent positions' });
    }
  });

  // Create position
  app.post('/api/positions', async (req, res) => {
    try {
      const result = insertPositionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [position] = await db.insert(positions).values(result.data).returning();
      res.status(201).json(position);
    } catch (error) {
      console.error('Error creating position:', error);
      res.status(500).json({ error: 'Failed to create position' });
    }
  });

  // Update position
  app.patch('/api/positions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertPositionSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [position] = await db.update(positions)
        .set(result.data)
        .where(eq(positions.id, id))
        .returning();
      
      if (!position) {
        return res.status(404).json({ error: 'Position not found' });
      }
      
      res.json(position);
    } catch (error) {
      console.error('Error updating position:', error);
      res.status(500).json({ error: 'Failed to update position' });
    }
  });

  // Delete position (when closed)
  app.delete('/api/positions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.delete(positions).where(eq(positions.id, id)).returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Position not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting position:', error);
      res.status(500).json({ error: 'Failed to delete position' });
    }
  });

  // Performance Snapshot Routes
  
  // Get performance snapshots for specific agent
  app.get('/api/performance/:agentId', async (req, res) => {
    try {
      const { agentId } = req.params;
      const snapshots = await db.select()
        .from(performanceSnapshots)
        .where(eq(performanceSnapshots.agentId, agentId))
        .orderBy(desc(performanceSnapshots.timestamp));
      res.json(snapshots);
    } catch (error) {
      console.error('Error fetching performance snapshots:', error);
      res.status(500).json({ error: 'Failed to fetch performance snapshots' });
    }
  });

  // Get all performance snapshots (for leaderboard chart)
  app.get('/api/performance', async (req, res) => {
    try {
      const snapshots = await db.select()
        .from(performanceSnapshots)
        .orderBy(desc(performanceSnapshots.timestamp));
      res.json(snapshots);
    } catch (error) {
      console.error('Error fetching all performance snapshots:', error);
      res.status(500).json({ error: 'Failed to fetch performance snapshots' });
    }
  });

  // Create performance snapshot
  app.post('/api/performance', async (req, res) => {
    try {
      const result = insertPerformanceSnapshotSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [snapshot] = await db.insert(performanceSnapshots).values(result.data).returning();
      res.status(201).json(snapshot);
    } catch (error) {
      console.error('Error creating performance snapshot:', error);
      res.status(500).json({ error: 'Failed to create performance snapshot' });
    }
  });

  // Activity Event Routes
  
  // Get recent activity events
  app.get('/api/activity', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const events = await db.select()
        .from(activityEvents)
        .orderBy(desc(activityEvents.timestamp))
        .limit(limit);
      res.json(events);
    } catch (error) {
      console.error('Error fetching activity events:', error);
      res.status(500).json({ error: 'Failed to fetch activity events' });
    }
  });

  // Create activity event
  app.post('/api/activity', async (req, res) => {
    try {
      const result = insertActivityEventSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
      }
      
      const [event] = await db.insert(activityEvents).values(result.data).returning();
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating activity event:', error);
      res.status(500).json({ error: 'Failed to create activity event' });
    }
  });

  // AsterDex Orders Routes
  
  // Get all AsterDex orders
  app.get('/api/asterdex/orders', async (req, res) => {
    try {
      const allOrders = await db.select()
        .from(asterdexOrders)
        .orderBy(desc(asterdexOrders.createdAt));
      res.json(allOrders);
    } catch (error) {
      console.error('Error fetching AsterDex orders:', error);
      res.status(500).json({ error: 'Failed to fetch AsterDex orders' });
    }
  });

  // Get AsterDex orders for specific agent
  app.get('/api/asterdex/orders/:agentId', async (req, res) => {
    try {
      const { agentId } = req.params;
      const agentOrders = await db.select()
        .from(asterdexOrders)
        .where(eq(asterdexOrders.agentId, agentId))
        .orderBy(desc(asterdexOrders.createdAt));
      res.json(agentOrders);
    } catch (error) {
      console.error('Error fetching agent AsterDex orders:', error);
      res.status(500).json({ error: 'Failed to fetch agent AsterDex orders' });
    }
  });

  // Leaderboard endpoint (combines agent data with latest performance)
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const allAgents = await db.select().from(agents);
      
      const leaderboard = allAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        model: agent.model,
        avatar: agent.avatar,
        currentCapital: agent.currentCapital,
        totalPnL: agent.totalPnL,
        totalPnLPercentage: agent.totalPnLPercentage,
        sharpeRatio: agent.sharpeRatio,
        totalTrades: agent.totalTrades,
        winRate: agent.winRate,
        isActive: agent.isActive,
      }));
      
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Crypto Prices endpoint
  app.get('/api/crypto/prices', async (req, res) => {
    try {
      const symbols = ['BTC', 'ETH', 'BNB'];
      const fsyms = symbols.join(',');
      
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=USD`
      );
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const prices = symbols.map(symbol => {
        const raw = data.RAW?.[symbol]?.USD;
        const display = data.DISPLAY?.[symbol]?.USD;
        
        return {
          symbol,
          name: symbol === 'BTC' ? 'Bitcoin' :
                symbol === 'ETH' ? 'Ethereum' :
                symbol === 'BNB' ? 'BNB Chain' : symbol,
          price: raw?.PRICE || 0,
          change24h: raw?.CHANGEPCT24HOUR || 0,
          marketCap: raw?.MKTCAP || 0,
        };
      });
      
      res.json(prices);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      res.status(500).json({ error: 'Failed to fetch crypto prices' });
    }
  });

  // Trading Control Routes (protected with API key)
  // IMPORTANT: These must be registered BEFORE the serverless check
  const { getTradingEngine } = await import("./trading-engine");
  
  // Get trading status (protected)
  app.get('/api/trading/status', requireTradingAuth, async (req, res) => {
    try {
      const tradingEngine = getTradingEngine();
      const status = tradingEngine.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching trading status:', error);
      res.status(500).json({ error: 'Failed to fetch trading status' });
    }
  });

  // Resume trading (protected)
  app.post('/api/trading/resume', requireTradingAuth, async (req, res) => {
    try {
      const tradingEngine = getTradingEngine();
      const result = await tradingEngine.resume();
      res.json(result);
    } catch (error) {
      console.error('Error resuming trading:', error);
      res.status(500).json({ error: 'Failed to resume trading' });
    }
  });

  // Pause trading (optionally close all positions) (protected)
  app.post('/api/trading/pause', requireTradingAuth, async (req, res) => {
    try {
      const tradingEngine = getTradingEngine();
      const { closePositions } = req.body;
      const result = await tradingEngine.pause(closePositions === true);
      res.json(result);
    } catch (error) {
      console.error('Error pausing trading:', error);
      res.status(500).json({ error: 'Failed to pause trading' });
    }
  });

  // Close all open positions (protected)
  app.post('/api/trading/close-all-positions', requireTradingAuth, async (req, res) => {
    try {
      const tradingEngine = getTradingEngine();
      const result = await tradingEngine.closeAllPositions();
      res.json({ 
        success: true, 
        ...result,
        message: `Closed ${result.closed} positions, ${result.errors} errors` 
      });
    } catch (error) {
      console.error('Error closing positions:', error);
      res.status(500).json({ error: 'Failed to close positions' });
    }
  });

  // Only create HTTP server if we're in a traditional server environment
  // For serverless (Vercel), we don't need a server
  if (typeof process.env.VERCEL === 'undefined') {
    const httpServer = createServer(app);
    return httpServer;
  }
  
  // Return undefined for serverless
  return undefined;
}
