import { db } from "./db";
import { agents } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Migration script to update all agents' initial capital
 * (defaults to $100.00, configurable via INITIAL_CAPITAL)
 * and reset PnL to 0.
 */
export async function migrateInitialCapital() {
  const initialCapital = (process.env.INITIAL_CAPITAL || "100.00").trim();
  console.log(`🔄 Starting initial capital migration to $${initialCapital}...`);

  try {
    const allAgents = await db.select().from(agents);
    console.log(`Found ${allAgents.length} agents to update`);

    let updatedCount = 0;

    for (const agent of allAgents) {
      // Update initial capital and reset PnL to 0.
      await db
        .update(agents)
        .set({
          initialCapital,
          currentCapital: initialCapital,
          totalPnL: "0.00",
          totalPnLPercentage: "0.00",
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agent.id));

      console.log(`✓ Updated ${agent.name}: initialCapital → $${initialCapital}, PnL → $0.00`);
      updatedCount++;
    }

    console.log(`✅ Migration complete! Updated ${updatedCount} agents`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

