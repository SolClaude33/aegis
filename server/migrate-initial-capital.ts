import { db } from "./db";
import { agents } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Migration script to update all agents' initial capital to $20
 * and reset PnL to 0 based on current AsterDex balance
 */
export async function migrateInitialCapital() {
  console.log("🔄 Starting initial capital migration to $20...");

  try {
    const allAgents = await db.select().from(agents);
    console.log(`Found ${allAgents.length} agents to update`);

    let updatedCount = 0;

    for (const agent of allAgents) {
      // Update initial capital to $20
      // Reset PnL to 0 (will be recalculated on next balance update from AsterDex)
      await db
        .update(agents)
        .set({
          initialCapital: "20.00",
          totalPnL: "0.00",
          totalPnLPercentage: "0.00",
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agent.id));

      console.log(`✓ Updated ${agent.name}: initialCapital → $20.00, PnL → $0.00`);
      updatedCount++;
    }

    console.log(`✅ Migration complete! Updated ${updatedCount} agents`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

