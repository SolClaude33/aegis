import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema.js";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

// Push schema to database if not exists
export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    // Check if agents table exists
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
      )`
    );

    const tableExists = result.rows[0].exists;

    if (!tableExists) {
      console.log("📋 Creating database tables...");
      
      // Create agents table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS agents (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          model TEXT NOT NULL,
          wallet_address TEXT NOT NULL UNIQUE,
          api_key_ref TEXT NOT NULL,
          api_secret_ref TEXT NOT NULL,
          initial_capital DECIMAL(18, 2) NOT NULL,
          current_capital DECIMAL(18, 2) NOT NULL,
          total_pnl DECIMAL(18, 2) NOT NULL DEFAULT '0',
          total_pnl_percentage DECIMAL(10, 2) NOT NULL DEFAULT '0',
          sharpe_ratio DECIMAL(10, 4) NOT NULL DEFAULT '0',
          total_trades INTEGER NOT NULL DEFAULT 0,
          win_rate DECIMAL(5, 2) NOT NULL DEFAULT '0',
          avatar TEXT,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create agent_strategies table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS agent_strategies (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR NOT NULL UNIQUE REFERENCES agents(id),
          strategy_type TEXT NOT NULL,
          risk_tolerance TEXT NOT NULL,
          max_position_size_percent DECIMAL(5, 2) NOT NULL DEFAULT '30',
          max_loss_per_trade_percent DECIMAL(5, 2) NOT NULL DEFAULT '5',
          trading_pair_preferences TEXT[] NOT NULL,
          trade_frequency_minutes INTEGER NOT NULL DEFAULT 5,
          use_stop_loss BOOLEAN NOT NULL DEFAULT true,
          stop_loss_percent DECIMAL(5, 2) DEFAULT '3',
          use_take_profit BOOLEAN NOT NULL DEFAULT true,
          take_profit_percent DECIMAL(5, 2) DEFAULT '10',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create performance_snapshots table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS performance_snapshots (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR NOT NULL REFERENCES agents(id),
          account_value DECIMAL(18, 2) NOT NULL,
          total_pnl DECIMAL(18, 2) NOT NULL,
          total_pnl_percentage DECIMAL(10, 2) NOT NULL,
          open_positions INTEGER NOT NULL DEFAULT 0,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create activity_events table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS activity_events (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR NOT NULL REFERENCES agents(id),
          event_type TEXT NOT NULL,
          message TEXT NOT NULL,
          asset TEXT,
          strategy TEXT,
          tx_hash TEXT,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create asterdex_orders table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS asterdex_orders (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR NOT NULL REFERENCES agents(id),
          asterdex_order_id TEXT,
          symbol TEXT NOT NULL,
          side TEXT NOT NULL,
          type TEXT NOT NULL,
          quantity DECIMAL(18, 8) NOT NULL,
          price DECIMAL(18, 2),
          status TEXT NOT NULL DEFAULT 'PENDING',
          filled_quantity DECIMAL(18, 8) DEFAULT '0',
          avg_filled_price DECIMAL(18, 2),
          strategy TEXT,
          llm_reasoning TEXT,
          llm_confidence DECIMAL(3, 2),
          action TEXT,
          direction TEXT,
          tx_hash TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create positions table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS positions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR NOT NULL REFERENCES agents(id),
          asset TEXT NOT NULL,
          side TEXT NOT NULL,
          size DECIMAL(18, 8) NOT NULL,
          entry_price DECIMAL(18, 2) NOT NULL,
          current_price DECIMAL(18, 2) NOT NULL,
          leverage INTEGER NOT NULL DEFAULT 1,
          unrealized_pnl DECIMAL(18, 2) NOT NULL DEFAULT '0',
          unrealized_pnl_percentage DECIMAL(10, 2) NOT NULL DEFAULT '0',
          strategy TEXT,
          llm_reasoning TEXT,
          llm_confidence DECIMAL(3, 2),
          open_tx_hash TEXT NOT NULL,
          opened_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create trades table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS trades (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR NOT NULL REFERENCES agents(id),
          asset TEXT NOT NULL,
          side TEXT NOT NULL,
          size DECIMAL(18, 8) NOT NULL,
          entry_price DECIMAL(18, 2) NOT NULL,
          exit_price DECIMAL(18, 2) NOT NULL,
          leverage INTEGER NOT NULL DEFAULT 1,
          realized_pnl DECIMAL(18, 2) NOT NULL,
          realized_pnl_percentage DECIMAL(10, 2) NOT NULL,
          duration INTEGER NOT NULL,
          strategy TEXT,
          llm_reasoning TEXT,
          llm_confidence DECIMAL(3, 2),
          open_tx_hash TEXT NOT NULL,
          close_tx_hash TEXT NOT NULL,
          opened_at TIMESTAMP NOT NULL,
          closed_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      console.log("✅ Database tables created successfully");
    } else {
      console.log("✅ Database tables already exist");
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    await pool.end();
    throw error;
  }
}

