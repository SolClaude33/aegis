import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { initializeDatabase } from "./init-db";
import { migrateTradingPairs } from "./migrate-trading-pairs";
import { migrateInitialCapital } from "./migrate-initial-capital";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database tables if not exist
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('⚠️  Database initialization failed:', error);
  }
  
  // Migrate trading pairs to only BTC, ETH, BNB
  try {
    await migrateTradingPairs();
  } catch (error) {
    console.error('⚠️  Trading pairs migration failed:', error);
  }
  
  // Migrate initial capital to $20
  try {
    await migrateInitialCapital();
  } catch (error) {
    console.error('⚠️  Initial capital migration failed:', error);
  }
  
  await seedDatabase();
  
  // Start trading engine after database is seeded
  const { getTradingEngine } = await import("./trading-engine");
  const tradingEngine = getTradingEngine();
  tradingEngine.start();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    if (server) {
      await setupVite(app, server);
    }
  } else {
    serveStatic(app);
  }

  // Only listen if we have a server (not in serverless environment)
  if (server) {
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }
})();
