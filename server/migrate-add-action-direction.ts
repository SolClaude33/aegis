import postgres from "postgres";

/**
 * Migration script to add action and direction columns to asterdex_orders table
 * These columns store OPEN/CLOSE action and LONG/SHORT direction from LLM decisions
 */
export async function migrateAddActionDirection() {
  console.log("🔄 Starting action/direction columns migration...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const client = postgres(process.env.DATABASE_URL, { max: 10 });
  
  try {
    // Check if columns already exist
    const checkAction = await client.unsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'asterdex_orders' 
      AND column_name = 'action'
    `);
    
    const checkDirection = await client.unsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'asterdex_orders' 
      AND column_name = 'direction'
    `);

    const actionExists = checkAction.length > 0;
    const directionExists = checkDirection.length > 0;

    if (actionExists && directionExists) {
      console.log("✅ Columns 'action' and 'direction' already exist, skipping migration");
      await client.end();
      return;
    }

    // Add action column if it doesn't exist
    if (!actionExists) {
      await client.unsafe(`
        ALTER TABLE asterdex_orders 
        ADD COLUMN IF NOT EXISTS action TEXT
      `);
      console.log("✅ Added 'action' column to asterdex_orders");
    }

    // Add direction column if it doesn't exist
    if (!directionExists) {
      await client.unsafe(`
        ALTER TABLE asterdex_orders 
        ADD COLUMN IF NOT EXISTS direction TEXT
      `);
      console.log("✅ Added 'direction' column to asterdex_orders");
    }

    console.log("✅ Migration complete! Added action and direction columns");
    await client.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await client.end();
    throw error;
  }
}

