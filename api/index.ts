import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';
import { seedDatabase } from '../server/seed';

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

