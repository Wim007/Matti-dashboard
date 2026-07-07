import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// Vangnetten op procesniveau: een onafgevangen fout in een fire-and-forget
// promise mag de server niet neerhalen
process.on("unhandledRejection", reason => {
  console.error("[Process] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", err => {
  console.error("[Process] Uncaught exception:", err);
});

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

  // Plain HTTP health endpoint — voor UptimeRobot/Railway monitoring
  app.get("/api/health", async (_req, res) => {
    let dbOk = false;
    try {
      const { getDb } = await import("../db");
      dbOk = !!(await getDb());
    } catch {
      dbOk = false;
    }
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? "ok" : "error",
      db: dbOk,
      ts: new Date().toISOString(),
    });
  });

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

  // REST API endpoint for Matti webapp event-stream (SESSION_START, MESSAGE_SENT, etc.)
  app.post("/api/analytics/events", async (req, res) => {
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
      
      // 3. Process event based on type
      const event = req.body;
      const eventType = event.type;
      
      if (!eventType) {
        return res.status(400).json({ error: "Missing event type" });
      }
      
      // Handle different event types from Matti webapp
      switch (eventType) {
        case "SESSION_START":
          // Store session start event
          await db.insert(analyticsEvents).values({
            appName: "matti",
            timestamp: new Date(event.timestamp || Date.now()),
            postalCodeArea: event.gemeente || "0000",
            ageGroup: event.leeftijdsgroep || "unknown",
            userType: "jongere",
            themes: [], // Will be filled in MESSAGE_SENT
            sessionDuration: 0, // Will be calculated in SESSION_END
            messageCount: 0,
            isReturningUser: !event.is_new_user,
            weeklyFrequency: 1,
            isHighRisk: false,
            safetySignal: false,
          });
          break;
          
        case "MESSAGE_SENT":
          // Update session with theme and message count
          // Note: This is a simplified implementation
          // In production, you'd want to track sessions properly
          break;
          
        case "RISK_DETECTED":
          // Store risk detection event
          await db.insert(analyticsEvents).values({
            appName: "matti",
            timestamp: new Date(event.timestamp || Date.now()),
            postalCodeArea: "0000", // Will be filled from session
            ageGroup: "unknown",
            userType: "jongere",
            themes: [event.riskType || "unknown"],
            sessionDuration: 0,
            messageCount: 0,
            isReturningUser: false,
            weeklyFrequency: 1,
            isHighRisk: true,
            safetySignal: event.action_taken === "escalated",
          });
          break;
          
        case "SESSION_END":
          // Store complete session with all metrics
          await db.insert(analyticsEvents).values({
            appName: "matti",
            timestamp: new Date(event.timestamp || Date.now()),
            postalCodeArea: "0000",
            ageGroup: "unknown",
            userType: "jongere",
            themes: [],
            sessionDuration: Math.round((event.duration_seconds || 0) / 60), // Convert to minutes
            messageCount: event.total_messages || 0,
            isReturningUser: false,
            weeklyFrequency: 1,
            satisfactionScore: event.satisfaction_score || null,
            isHighRisk: false,
            safetySignal: false,
          });
          break;
          
        default:
          return res.status(400).json({ error: `Unknown event type: ${eventType}` });
      }
      
      res.status(200).json({ success: true, eventType });
    } catch (error) {
      console.error("[Analytics Events API] Error:", error);
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
  // In productie (Railway) MOET de server op $PORT luisteren — stilletjes
  // uitwijken naar een andere poort maakt het dashboard onbereikbaar terwijl
  // het proces "gezond" lijkt. Liever hard falen zodat Railway herstart.
  const port = process.env.NODE_ENV === "production"
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.on("error", err => {
    console.error(`[Server] Kon niet luisteren op poort ${port}:`, err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
