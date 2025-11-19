import { db } from "./db";
import { agents, agentStrategies, performanceSnapshots, activityEvents } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Migration script to remove Llama-3.1 agent and all related data
 */
export async function migrateRemoveLlama() {
  console.log("🔄 Starting Llama-3.1 removal migration...");

  try {
    // Find Llama-3.1 agent
    const llamaAgent = await db
      .select()
      .from(agents)
      .where(sql`${agents.name} = 'Llama-3.1'`)
      .limit(1);

    if (llamaAgent.length === 0) {
      console.log("✓ Llama-3.1 agent not found, skipping removal");
      return { success: true, removed: false };
    }

    const agentId = llamaAgent[0].id;
    console.log(`Found Llama-3.1 agent with ID: ${agentId}`);

    // Delete related data first (foreign key constraints)
    await db.delete(activityEvents).where(eq(activityEvents.agentId, agentId));
    console.log("✓ Deleted activity events");

    await db.delete(performanceSnapshots).where(eq(performanceSnapshots.agentId, agentId));
    console.log("✓ Deleted performance snapshots");

    await db.delete(agentStrategies).where(eq(agentStrategies.agentId, agentId));
    console.log("✓ Deleted agent strategies");

    // Finally delete the agent
    await db.delete(agents).where(eq(agents.id, agentId));
    console.log("✓ Deleted Llama-3.1 agent");

    console.log("✅ Migration complete! Llama-3.1 agent and all related data removed");
    return { success: true, removed: true };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

