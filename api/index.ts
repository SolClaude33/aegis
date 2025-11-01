import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the Express app instance
let app: any = null;

let initPromise: Promise<void> | null = null;

function initializeApp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const express = await import('express');
      const { registerRoutes } = await import('./lib/routes.js');
      const { serveStatic } = await import('./lib/serve-static.js');
      const { seedDatabase } = await import('./lib/seed.js');
      const { initializeDatabase } = await import('./lib/init-db.js');
      
      // Initialize Express app
      app = express.default();
      app.use(express.default.json());
      app.use(express.default.urlencoded({ extended: false }));
      
      // Initialize database tables (with error handling)
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('⚠️  Database initialization failed:', error);
      }
      
      // Seed database (with error handling)
      try {
        await seedDatabase();
      } catch (error) {
        console.error('⚠️  Database seed failed (may already be seeded):', error);
      }
      
      // Register routes
      await registerRoutes(app);
      
      // Serve static files
      serveStatic(app);
      
      console.log('✅ Express app initialized for Vercel serverless');
    })();
  }
  
  return initPromise;
}

async function getExpressApp() {
  if (!app) {
    await initializeApp();
  }
  
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getExpressApp();
    return expressApp(req, res);
  } catch (error: any) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message || 'Unknown error',
      hint: 'Check server logs for details'
    });
  }
}

