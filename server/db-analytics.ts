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
  if (filters.appName) {
    conditions.push(eq(analyticsEvents.appName, filters.appName));
  }
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
    const themes = event.themes as string[];
    themes.forEach((theme) => {
      themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
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

  // Use raw SQL for date extraction to ensure compatibility
  const dateColumn = sql<string>`DATE(${analyticsEvents.timestamp})`;
  const result = await db
    .select({
      date: dateColumn.as('date'),
      avgDuration: sql<number>`AVG(${analyticsEvents.sessionDuration})`.as('avgDuration'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(dateColumn)
    .orderBy(dateColumn);

  return result;
}

export async function getMessageCountTimeSeries(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  const dateColumn = sql<string>`DATE(${analyticsEvents.timestamp})`;
  const result = await db
    .select({
      date: dateColumn.as('date'),
      avgMessages: sql<number>`AVG(${analyticsEvents.messageCount})`.as('avgMessages'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(dateColumn)
    .orderBy(dateColumn);

  return result;
}

export async function getRiskMetrics(filters: AnalyticsFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  const result = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`.as('date'),
      highRiskCount: sql<number>`SUM(CASE WHEN ${analyticsEvents.isHighRisk} THEN 1 ELSE 0 END)`.as('highRiskCount'),
      safetySignalCount: sql<number>`SUM(CASE WHEN ${analyticsEvents.safetySignal} THEN 1 ELSE 0 END)`.as('safetySignalCount'),
      totalCount: sql<number>`COUNT(*)`.as('totalCount'),
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

  return result;
}
