import { and, eq, gte, lte, sql } from "drizzle-orm";
import { analyticsEvents } from "../drizzle/schema";
import { getDb } from "./db";

export interface AnalyticsFilters {
  appName?: "matti" | "opvoedmaatje";
  startDate?: Date;
  endDate?: Date;
}

function buildConditions(filters: AnalyticsFilters) {
  const conditions = [];
  
  // Always filter for Matti app only
  conditions.push(eq(analyticsEvents.appName, 'matti'));
  
  // Always filter for youth ages 12-21 (using age groups)
  conditions.push(sql`${analyticsEvents.ageGroup} IN ('12-14', '15-17', '18-21')`);
  
  if (filters.startDate) {
    conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(analyticsEvents.timestamp, filters.endDate));
  }
  return conditions;
}

export async function getDemographicsByAgeGroup(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  const result = await db
    .select({
      ageGroup: analyticsEvents.ageGroup,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(analyticsEvents.ageGroup);

  return result;
}

export async function getDemographicsByPostalCode(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  const result = await db
    .select({
      postalCodeArea: analyticsEvents.postalCodeArea,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(analyticsEvents.postalCodeArea)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  return result;
}

export async function getDemographicsByUserType(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  const result = await db
    .select({
      userType: analyticsEvents.userType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(analyticsEvents.userType);

  return result;
}

export async function getDemographicsByFamilyType(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);
  conditions.push(sql`${analyticsEvents.familyType} IS NOT NULL`);

  const result = await db
    .select({
      familyType: analyticsEvents.familyType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(and(...conditions))
    .groupBy(analyticsEvents.familyType);

  return result;
}

export async function getThemeFrequency(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  // Get all events with themes
  const events = await db
    .select({
      themes: analyticsEvents.themes,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Count theme occurrences
  const themeCount = new Map<string, number>();
  events.forEach((event) => {
    if (!event.themes) return;
    // Themes are stored as JSON array
    const themes = event.themes as string[];
    themes.forEach((theme) => {
      if (theme) {
        themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
      }
    });
  });

  // Convert to array and sort by count
  return Array.from(themeCount.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getReferralDistribution(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);
  conditions.push(sql`${analyticsEvents.referralType} IS NOT NULL`);

  const result = await db
    .select({
      referralType: analyticsEvents.referralType,
      count: sql<number>`count(*)`,
      avgDaysToReferral: sql<number>`avg(${analyticsEvents.daysToReferral})`,
    })
    .from(analyticsEvents)
    .where(and(...conditions))
    .groupBy(analyticsEvents.referralType);

  return result;
}

export async function getSessionDurationTimeSeries(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  // Fetch all records and group in Node.js (TiDB doesn't support date functions in GROUP BY)
  const records = await db
    .select({
      timestamp: analyticsEvents.timestamp,
      sessionDuration: analyticsEvents.sessionDuration,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Group by date in Node.js
  const grouped = new Map<string, { totalDuration: number; count: number }>();
  
  for (const record of records) {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const existing = grouped.get(date) || { totalDuration: 0, count: 0 };
    existing.totalDuration += record.sessionDuration;
    existing.count += 1;
    grouped.set(date, existing);
  }

  // Convert to array and calculate averages
  const result = Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      avgDuration: data.totalDuration / data.count,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

export async function getMessageCountTimeSeries(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  // Fetch all records and group in Node.js (TiDB doesn't support date functions in GROUP BY)
  const records = await db
    .select({
      timestamp: analyticsEvents.timestamp,
      messageCount: analyticsEvents.messageCount,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Group by date in Node.js
  const grouped = new Map<string, { totalMessages: number; count: number }>();
  
  for (const record of records) {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const existing = grouped.get(date) || { totalMessages: 0, count: 0 };
    existing.totalMessages += record.messageCount;
    existing.count += 1;
    grouped.set(date, existing);
  }

  // Convert to array and calculate averages
  const result = Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      avgMessages: data.totalMessages / data.count,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

export async function getRiskMetrics(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  // Fetch all records and group in Node.js (TiDB doesn't support date functions in GROUP BY)
  const records = await db
    .select({
      timestamp: analyticsEvents.timestamp,
      isHighRisk: analyticsEvents.isHighRisk,
      safetySignal: analyticsEvents.safetySignal,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Group by date in Node.js
  const grouped = new Map<string, { highRiskCount: number; safetySignalCount: number; totalCount: number }>();
  
  for (const record of records) {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const existing = grouped.get(date) || { highRiskCount: 0, safetySignalCount: 0, totalCount: 0 };
    existing.highRiskCount += record.isHighRisk ? 1 : 0;
    existing.safetySignalCount += record.safetySignal ? 1 : 0;
    existing.totalCount += 1;
    grouped.set(date, existing);
  }

  // Convert to array and sort by date
  const result = Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      highRiskCount: data.highRiskCount,
      safetySignalCount: data.safetySignalCount,
      totalCount: data.totalCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}
