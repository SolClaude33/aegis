import { db } from "./db";
import { agentStrategies } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to update all agent trading pairs to include BTC, ETH, BNB, ASTER
 * Removes SOLUSDT, DOGEUSDT, and any other pairs that are not BTCUSDT, ETHUSDT, BNBUSDT, or ASTERUSDT
 */
export async function migrateTradingPairs() {
  console.log("🔄 Starting trading pairs migration...");

  try {
    // Get all agent strategies
    const allStrategies = await db.select().from(agentStrategies);

    console.log(`Found ${allStrategies.length} agent strategies to update`);

    let updatedCount = 0;

    for (const strategy of allStrategies) {
      const currentPairs = strategy.tradingPairPreferences || [];
      
      // Filter to only include BTCUSDT, ETHUSDT, BNBUSDT, ASTERUSDT
      const allowedPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ASTERUSDT"];
      const newPairs = currentPairs.filter((pair: string) => 
        allowedPairs.includes(pair)
      );

      // Always ensure all four pairs are present (add missing ones)
      const finalPairs = [...new Set([...allowedPairs, ...newPairs])].sort();

      // Only update if pairs changed
      if (JSON.stringify(currentPairs.sort()) !== JSON.stringify(finalPairs.sort())) {
        await db
          .update(agentStrategies)
          .set({
            tradingPairPreferences: sql`ARRAY[${sql.join(
              finalPairs.map((pair: string) => sql`${pair}`),
              sql`, `
            )}]`,
            updatedAt: sql`NOW()`,
          })
          .where(sql`${agentStrategies.id} = ${strategy.id}`);

        console.log(
          `✓ Updated ${strategy.agentId}: ${currentPairs.join(", ")} → ${finalPairs.join(", ")}`
        );
        updatedCount++;
      } else {
        console.log(`- Skipped ${strategy.agentId}: already correct`);
      }
    }

    console.log(`✅ Migration complete! Updated ${updatedCount} agent strategies`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

