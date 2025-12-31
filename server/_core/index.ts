import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // REST API endpoint for external analytics events
  app.post("/api/analytics/event", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const { apiKeys, analyticsEvents } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      
      // 1. Validate API key
      const apiKey = req.headers["x-api-key"] as string;
      if (!apiKey) {
        return res.status(401).json({ error: "Missing X-API-Key header" });
      }
      
      const [keyRecord] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.key, apiKey), eq(apiKeys.isActive, true)))
        .limit(1);
      
      if (!keyRecord) {
        return res.status(401).json({ error: "Invalid or inactive API key" });
      }
      
      // 2. Update last used timestamp
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id));
      
      // 3. Validate and insert event
      const event = req.body;
      
      // Required fields validation
      if (!event.appName || !event.postalCodeArea || !event.ageGroup || 
          !event.userType || !Array.isArray(event.themes) || 
          typeof event.sessionDuration !== 'number' || 
          typeof event.messageCount !== 'number' ||
          typeof event.isHighRisk !== 'boolean' ||
          typeof event.safetySignal !== 'boolean') {
        return res.status(400).json({ error: "Missing or invalid required fields" });
      }
      
      // Insert event
      await db.insert(analyticsEvents).values({
        appName: event.appName,
        timestamp: new Date(),
        postalCodeArea: event.postalCodeArea,
        ageGroup: event.ageGroup,
        userType: event.userType,
        familyType: event.familyType || null,
        themes: event.themes,
        sessionDuration: event.sessionDuration,
        messageCount: event.messageCount,
        isReturningUser: false, // Will be calculated later
        weeklyFrequency: 1, // Will be calculated later
        referralType: event.referralType || null,
        daysToReferral: event.daysToReferral || null,
        satisfactionScore: event.satisfactionScore || null,
        selfReportedImprovement: event.selfReportedImprovement || null,
        isHighRisk: event.isHighRisk,
        safetySignal: event.safetySignal,
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Analytics API] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
