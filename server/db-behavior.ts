/**
 * Database queries for behavior change tracking
 * Tracks user journey from initial concern to outcome (e.g., screen time → active hobbies)
 */

import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { analyticsEvents } from "../drizzle/schema";
import { getDb } from "./db";

export interface BehaviorFilters {
  startDate?: Date;
  endDate?: Date;
  ageGroup?: '12-14' | '15-17' | '18-21';
}

function buildConditions(filters: BehaviorFilters) {
  const conditions = [];
  
  // Always filter for Matti app only
  conditions.push(eq(analyticsEvents.appName, 'matti'));
  
  // Filter by age group if specified, otherwise all youth ages
  if (filters.ageGroup) {
    conditions.push(eq(analyticsEvents.ageGroup, filters.ageGroup));
  } else {
    conditions.push(sql`${analyticsEvents.ageGroup} IN ('12-14', '15-17', '18-21')`);
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
 * Get screen time to active hobby conversion metrics
 */
export async function getScreenTimeToActionMetrics(filters: BehaviorFilters) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const conditions = buildConditions(filters);
  
  // Add condition for screen time related concerns
  conditions.push(sql`${analyticsEvents.initialConcern} LIKE '%scherm%'`);
  
  const results = await db
    .select({
      totalCases: sql<number>`COUNT(*)`,
      improved: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} IN ('improved', 'resolved') THEN 1 ELSE 0 END)`,
      ongoing: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} = 'ongoing' THEN 1 ELSE 0 END)`,
      avgInterventionDays: sql<number>`AVG(${analyticsEvents.interventionDays})`,
      avgActionsCompleted: sql<number>`AVG(${analyticsEvents.actionsCompleted})`,
      totalActionsCompleted: sql<number>`SUM(${analyticsEvents.actionsCompleted})`,
    })
    .from(analyticsEvents)
    .where(and(...conditions));
  
  const result = results[0];
  
  return {
    totalCases: Number(result.totalCases) || 0,
    improved: Number(result.improved) || 0,
    ongoing: Number(result.ongoing) || 0,
    conversionRate: result.totalCases > 0 ? (Number(result.improved) / Number(result.totalCases)) * 100 : 0,
    avgInterventionDays: Math.round(Number(result.avgInterventionDays) || 0),
    avgActionsCompleted: Number(result.avgActionsCompleted) || 0,
    totalActionsCompleted: Number(result.totalActionsCompleted) || 0,
  };
}

/**
 * Get behavior change outcomes by initial concern
 */
export async function getBehaviorChangeByInitialConcern(filters: BehaviorFilters) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const conditions = buildConditions(filters);
  
  // Only include events with initial concern tracked
  conditions.push(isNotNull(analyticsEvents.initialConcern));
  
  const results = await db
    .select({
      initialConcern: analyticsEvents.initialConcern,
      totalCases: sql<number>`COUNT(*)`,
      resolved: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} = 'resolved' THEN 1 ELSE 0 END)`,
      improved: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} = 'improved' THEN 1 ELSE 0 END)`,
      ongoing: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} = 'ongoing' THEN 1 ELSE 0 END)`,
      escalated: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} = 'escalated' THEN 1 ELSE 0 END)`,
      avgInterventionDays: sql<number>`AVG(${analyticsEvents.interventionDays})`,
    })
    .from(analyticsEvents)
    .where(and(...conditions))
    .groupBy(analyticsEvents.initialConcern);
  
  return results.map((row: any) => ({
    initialConcern: row.initialConcern || 'Onbekend',
    totalCases: Number(row.totalCases),
    resolved: Number(row.resolved),
    improved: Number(row.improved),
    ongoing: Number(row.ongoing),
    escalated: Number(row.escalated),
    successRate: row.totalCases > 0 
      ? ((Number(row.resolved) + Number(row.improved)) / Number(row.totalCases)) * 100 
      : 0,
    avgInterventionDays: Math.round(Number(row.avgInterventionDays) || 0),
  }));
}

/**
 * Get timeline of behavior change interventions
 */
export async function getBehaviorChangeTimeline(filters: BehaviorFilters) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const conditions = buildConditions(filters);
  
  // Only include completed interventions
  conditions.push(isNotNull(analyticsEvents.interventionDays));
  
  const results = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`,
      totalInterventions: sql<number>`COUNT(*)`,
      successful: sql<number>`SUM(CASE WHEN ${analyticsEvents.outcomeStatus} IN ('improved', 'resolved') THEN 1 ELSE 0 END)`,
      avgDuration: sql<number>`AVG(${analyticsEvents.interventionDays})`,
    })
    .from(analyticsEvents)
    .where(and(...conditions))
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);
  
  return results.map((row: any) => ({
    date: row.date,
    totalInterventions: Number(row.totalInterventions),
    successful: Number(row.successful),
    successRate: row.totalInterventions > 0 
      ? (Number(row.successful) / Number(row.totalInterventions)) * 100 
      : 0,
    avgDuration: Math.round(Number(row.avgDuration) || 0),
  }));
}

/**
 * Get ROI calculation for municipalities
 * Based on prevented escalation to professional care
 */
export async function getBehaviorChangeROI(filters: BehaviorFilters) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const conditions = buildConditions(filters);
  
  // Only include resolved/improved cases
  conditions.push(sql`${analyticsEvents.outcomeStatus} IN ('improved', 'resolved')`);
  
  const results = await db
    .select({
      totalSuccessful: sql<number>`COUNT(*)`,
      avgActionsCompleted: sql<number>`AVG(${analyticsEvents.actionsCompleted})`,
    })
    .from(analyticsEvents)
    .where(and(...conditions));
  
  const result = results[0];
  const totalSuccessful = Number(result.totalSuccessful) || 0;
  
  // Estimated cost avoidance per successful intervention
  // Based on preventing escalation to youth mental health care (€2500-5000 per case)
  const avgCostAvoidancePerCase = 3500;
  const totalCostAvoidance = totalSuccessful * avgCostAvoidancePerCase;
  
  return {
    totalSuccessful,
    avgActionsCompleted: Number(result.avgActionsCompleted) || 0,
    avgCostAvoidancePerCase,
    totalCostAvoidance,
  };
}
