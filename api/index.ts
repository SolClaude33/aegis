import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import to avoid initialization issues
let app: any = null;

async function getApp() {
  if (!app) {
    const express = await import('express');
    const { registerRoutes } = await import('../server/routes.js');
    const { serveStatic } = await import('../server/vite.js');
    const { seedDatabase } = await import('../server/seed.js');
    
    // Initialize Express app
    app = express.default();
    app.use(express.default.json());
    app.use(express.default.urlencoded({ extended: false }));
    
    // Seed database
    await seedDatabase();
    
    // Register routes (returns Server but we don't need it for serverless)
    await registerRoutes(app);
    
    // Serve static files
    serveStatic(app);
  }
  return app;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const expressApp = await getApp();
  return expressApp(req, res);
};

