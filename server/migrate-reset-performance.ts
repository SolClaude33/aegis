import { db } from "./db";
import { performanceSnapshots } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to clear all old performance snapshots
 * This resets the chart to start fresh from the next deployment
 */
export async function migrateResetPerformance() {
  console.log("🔄 Starting performance snapshots reset migration...");

  try {
    // Delete all existing performance snapshots
    const result = await db.delete(performanceSnapshots);
    
    console.log(`✅ Successfully cleared all performance snapshots. Chart will start fresh from now.`);
    return { success: true, cleared: true };
  } catch (error) {
    console.error("❌ Performance snapshots reset migration failed:", error);
    throw error;
  }
}

