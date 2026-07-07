import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { analyticsEvents, apiKeys, InsertAnalyticsEvent, InsertApiKey, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Analytics Events
export async function insertAnalyticsEvent(event: InsertAnalyticsEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(analyticsEvents).values(event);
  return result;
}

export async function getAnalyticsEvents(filters?: {
  appName?: "matti" | "opvoedmaatje";
  startDate?: Date;
  endDate?: Date;
  school?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (filters?.appName) {
    conditions.push(eq(analyticsEvents.appName, filters.appName));
  }
  if (filters?.startDate) {
    conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(analyticsEvents.timestamp, filters.endDate));
  }
  if (filters?.school) {
    conditions.push(eq(analyticsEvents.school, filters.school));
  }

  const query = db
    .select()
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(analyticsEvents.timestamp));

  if (filters?.limit) {
    return await query.limit(filters.limit);
  }

  return await query;
}

export async function getAnalyticsSummary(filters?: {
  appName?: "matti" | "opvoedmaatje";
  startDate?: Date;
  endDate?: Date;
  school?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (filters?.appName) {
    conditions.push(eq(analyticsEvents.appName, filters.appName));
  }
  if (filters?.startDate) {
    conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(analyticsEvents.timestamp, filters.endDate));
  }
  if (filters?.school) {
    conditions.push(eq(analyticsEvents.school, filters.school));
  }

  const result = await db
    .select({
      totalEvents: sql<number>`count(*)`,
      uniqueUsers: sql<number>`count(distinct ${analyticsEvents.postalCodeArea})`,
      avgSessionDuration: sql<number>`avg(${analyticsEvents.sessionDuration})`,
      avgMessageCount: sql<number>`avg(${analyticsEvents.messageCount})`,
      returningUserRate: sql<number>`avg(case when ${analyticsEvents.isReturningUser} then 1 else 0 end) * 100`,
      highRiskCount: sql<number>`sum(case when ${analyticsEvents.isHighRisk} then 1 else 0 end)`,
      safetySignalCount: sql<number>`sum(case when ${analyticsEvents.safetySignal} then 1 else 0 end)`,
      avgSatisfactionScore: sql<number>`avg(${analyticsEvents.satisfactionScore})`,
      improvementRate: sql<number>`avg(case when ${analyticsEvents.selfReportedImprovement} then 1 else 0 end) * 100`,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0];
}

/** Alle scholen die in de events voorkomen — voor de schoolkiezer in het menu */
export async function getSchools(): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .selectDistinct({ school: analyticsEvents.school })
    .from(analyticsEvents)
    .where(sql`${analyticsEvents.school} IS NOT NULL AND ${analyticsEvents.school} != ''`);
  return rows
    .map((r) => r.school)
    .filter((v): v is string => !!v)
    .sort((a, b) => a.localeCompare(b, "nl"));
}

// API Keys
export async function createApiKey(apiKey: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(apiKeys).values(apiKey);
  return result;
}

export async function getApiKeyByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateApiKeyLastUsed(keyId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

export async function getAllApiKeys() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function toggleApiKeyStatus(keyId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(apiKeys).set({ isActive }).where(eq(apiKeys.id, keyId));
}
