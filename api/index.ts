import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes.js';
import { serveStatic } from '../server/vite.js';
import { seedDatabase } from '../server/seed.js';

// Initialize Express app once (Vercel caches this)
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Seed database and setup routes
(async () => {
  await seedDatabase();
  await registerRoutes(app);
  serveStatic(app);
})();

export default app;

