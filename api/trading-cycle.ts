import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // Import trading engine dynamically
    const { getTradingEngine } = await import('./lib/trading-engine.js');
    const engine = getTradingEngine();
    
    // Run a single trading cycle
    console.log('⚡ Running scheduled trading cycle...');
    await engine.runSingleCycle();
    
    return res.status(200).json({ 
      success: true,
      message: 'Trading cycle completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Trading cycle error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

