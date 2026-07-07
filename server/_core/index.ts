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

// Runtime schema-check: voegt de school-kolom toe als die nog niet bestaat
// (er draait geen migratiestap bij deploy)
async function ensureSchema() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Migrations] DATABASE_URL niet ingesteld — schema-check overgeslagen");
    return;
  }
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(url);
    try {
      const [rows] = await conn.query(
        "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'analytics_events' AND COLUMN_NAME = 'school'"
      );
      const count = Array.isArray(rows) ? Number((rows[0] as any)?.c ?? 0) : 0;
      if (!count) {
        await conn.query("ALTER TABLE analytics_events ADD COLUMN school VARCHAR(120) NULL");
        console.log("[Migrations] Kolom analytics_events.school toegevoegd");
      }
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.error("[Migrations] Schema-check mislukt:", err);
  }
}

async function startServer() {
  await ensureSchema();

  if (!process.env.JWT_SECRET) {
    console.warn("[Auth] JWT_SECRET niet ingesteld — inloggen zal falen (sessies kunnen niet ondertekend worden)");
  }
  if (!process.env.DASHBOARD_PASSWORD) {
    console.warn("[Auth] DASHBOARD_PASSWORD niet ingesteld — de wachtwoord-login is uitgeschakeld");
  }

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
        school: typeof event.school === "string" && event.school.trim() ? event.school.trim().slice(0, 120) : null,
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
      
      // Uniforme verwerking: Matti/Opvoedmaatje sturen het geconverteerde
      // formaat (appName, postalCodeArea, ageGroup, themes, ...). De oude
      // switch las veldnamen die nooit werden meegestuurd, waardoor events
      // als "0000/unknown" binnenkwamen en INTERVENTION_OUTCOME werd geweigerd.
      const KNOWN_TYPES = ["SESSION_START", "MESSAGE_SENT", "RISK_DETECTED", "SESSION_END", "INTERVENTION_OUTCOME"];
      if (!KNOWN_TYPES.includes(eventType)) {
        return res.status(400).json({ error: `Unknown event type: ${eventType}` });
      }

      // MESSAGE_SENT alleen bevestigen: géén databaserij per los bericht
      if (eventType !== "MESSAGE_SENT") {
        const clean = (v: unknown, max: number) =>
          typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
        const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);

        await db.insert(analyticsEvents).values({
          appName: event.appName === "opvoedmaatje" ? "opvoedmaatje" : "matti",
          timestamp: new Date(event.timestamp || Date.now()),
          postalCodeArea: clean(event.postalCodeArea, 20) ?? clean(event.gemeente, 20) ?? "0000",
          ageGroup: clean(event.ageGroup, 20) ?? clean(event.leeftijdsgroep, 20) ?? "unknown",
          userType: event.userType === "ouder" ? "ouder" : "jongere",
          familyType: ["eenouder", "tweeouder", "samengesteld"].includes(event.familyType) ? event.familyType : null,
          themes: Array.isArray(event.themes) ? event.themes.slice(0, 10).map(String) : [],
          sessionDuration: num(event.sessionDuration),
          messageCount: num(event.messageCount),
          isReturningUser: event.isReturningUser === true,
          weeklyFrequency: 1,
          satisfactionScore: event.satisfactionScore != null && Number.isFinite(Number(event.satisfactionScore)) ? Number(event.satisfactionScore) : null,
          selfReportedImprovement: typeof event.selfReportedImprovement === "boolean" ? event.selfReportedImprovement : null,
          isHighRisk: event.isHighRisk === true || eventType === "RISK_DETECTED",
          safetySignal: event.safetySignal === true,
          school: clean(event.school, 120),
        });
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
