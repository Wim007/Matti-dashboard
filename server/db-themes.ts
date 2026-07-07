/**
 * Database queries for Matti themes analysis
 */

import { and, eq, gte, lte, sql } from "drizzle-orm";
import { analyticsEvents } from "../drizzle/schema";
import { getDb } from "./db";

export interface ThemeFilters {
  school?: string;
  startDate?: Date;
  endDate?: Date;
  ageGroup?: '12-14' | '15-17' | '18-21';
}

function buildConditions(filters: ThemeFilters) {
  const conditions = [];
  
  // Always filter for Matti app only
  conditions.push(eq(analyticsEvents.appName, 'matti'));
  
  // Filter by age group if specified, otherwise all youth ages
  if (filters.ageGroup) {
    conditions.push(eq(analyticsEvents.ageGroup, filters.ageGroup));
  } else {
    conditions.push(sql`${analyticsEvents.ageGroup} IN ('12-14', '15-17', '18-21')`);
  }
  
  if (filters.school) {
    conditions.push(eq(analyticsEvents.school, filters.school));
  }
  if (filters.startDate) {
    conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(analyticsEvents.timestamp, filters.endDate));
  }
  return conditions;
}

/**
 * Get theme statistics (frequency, average duration)
 */
export async function getThemeStats(filters: ThemeFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  // Get all events with their themes
  const events = await db
    .select({
      themes: analyticsEvents.themes,
      sessionDuration: analyticsEvents.sessionDuration,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Process themes (stored as JSON array)
  const themeMap = new Map<string, { count: number; totalDuration: number }>();

  events.forEach(event => {
    let themes: string[] = [];
    
    // Parse themes from JSON
    if (typeof event.themes === 'string') {
      try {
        themes = JSON.parse(event.themes);
      } catch {
        themes = [];
      }
    } else if (Array.isArray(event.themes)) {
      themes = event.themes;
    }

    themes.forEach(theme => {
      const existing = themeMap.get(theme) || { count: 0, totalDuration: 0 };
      themeMap.set(theme, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (event.sessionDuration || 0),
      });
    });
  });

  // Convert to array with averages
  return Array.from(themeMap.entries()).map(([theme, data]) => ({
    theme,
    count: data.count,
    avgDuration: data.totalDuration / data.count,
  }));
}

/**
 * Get theme distribution by age group
 */
export async function getThemesByAgeGroup(filters: ThemeFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);

  // Get all events with their themes and age groups
  const events = await db
    .select({
      themes: analyticsEvents.themes,
      ageGroup: analyticsEvents.ageGroup,
    })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Process themes by age group
  const themeAgeMap = new Map<string, Map<string, number>>();

  events.forEach(event => {
    let themes: string[] = [];
    
    // Parse themes from JSON
    if (typeof event.themes === 'string') {
      try {
        themes = JSON.parse(event.themes);
      } catch {
        themes = [];
      }
    } else if (Array.isArray(event.themes)) {
      themes = event.themes;
    }

    themes.forEach(theme => {
      if (!themeAgeMap.has(theme)) {
        themeAgeMap.set(theme, new Map());
      }
      const ageMap = themeAgeMap.get(theme)!;
      ageMap.set(event.ageGroup, (ageMap.get(event.ageGroup) || 0) + 1);
    });
  });

  // Convert to flat array
  const result: Array<{ theme: string; ageGroup: string; count: number }> = [];
  themeAgeMap.forEach((ageMap, theme) => {
    ageMap.forEach((count, ageGroup) => {
      result.push({ theme, ageGroup, count });
    });
  });

  return result;
}
