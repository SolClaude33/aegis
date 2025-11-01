import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the Express app instance
let app: any = null;

let initPromise: Promise<void> | null = null;

function initializeApp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const express = await import('express');
      const { registerRoutes } = await import('../server/routes');
      const { serveStatic } = await import('../server/vite');
      const { seedDatabase } = await import('../server/seed');
      
      // Initialize Express app
      app = express.default();
      app.use(express.default.json());
      app.use(express.default.urlencoded({ extended: false }));
      
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
  const expressApp = await getExpressApp();
  return expressApp(req, res);
}

