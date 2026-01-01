/**
 * Database queries for funding-related KPIs and impact metrics
 */

import { getDb } from './db';
import { improvementScores, referralTracking, costConfig, analyticsEvents } from '../drizzle/schema';
import { and, eq, gte, lte, isNotNull, sql, count, avg } from 'drizzle-orm';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface ImprovementStats {
  averageImprovement: number; // Percentage
  totalMeasurements: number;
  averageConversations: number;
  byTheme: Array<{
    theme: string;
    improvement: number;
    count: number;
  }>;
}

export interface CostAvoidanceStats {
  totalAvoidedCost: number;
  preventedJeugdGGZ: number;
  preventedCrisis: number;
  preventedSpecialistCare: number;
  preventedOutOfHome: number;
  breakdown: Array<{
    careType: string;
    count: number;
    costPerCase: number;
    totalCost: number;
  }>;
}

export interface EscalationPreventionStats {
  highRiskUsers: number;
  stabilizedUsers: number;
  preventionRate: number; // Percentage
}

/**
 * Get improvement statistics from theme scores
 */
export async function getImprovementStats(dateRange: DateRange = {}): Promise<ImprovementStats> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { startDate, endDate } = dateRange;

  // Build where conditions
  const conditions = [
    isNotNull(improvementScores.scoreCurrent), // Only completed measurements
  ];

  if (startDate) {
    conditions.push(gte(improvementScores.followUpAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(improvementScores.followUpAt, endDate));
  }

  // Get all completed measurements
  const measurements = await db
    .select({
      theme: improvementScores.theme,
      scoreStart: improvementScores.scoreStart,
      scoreCurrent: improvementScores.scoreCurrent,
      userId: improvementScores.userId,
    })
    .from(improvementScores)
    .where(and(...conditions));

  if (measurements.length === 0) {
    return {
      averageImprovement: 0,
      totalMeasurements: 0,
      averageConversations: 0,
      byTheme: [],
    };
  }

  // Calculate improvements
  const improvements = measurements.map(m => {
    const improvement = ((m.scoreStart - (m.scoreCurrent || m.scoreStart)) / m.scoreStart) * 100;
    return { ...m, improvement };
  });

  const averageImprovement = improvements.reduce((sum, m) => sum + m.improvement, 0) / improvements.length;

  // Group by theme
  const themeMap = new Map<string, { sum: number; count: number }>();
  improvements.forEach(m => {
    const existing = themeMap.get(m.theme) || { sum: 0, count: 0 };
    themeMap.set(m.theme, {
      sum: existing.sum + m.improvement,
      count: existing.count + 1,
    });
  });

  const byTheme = Array.from(themeMap.entries())
    .map(([theme, stats]) => ({
      theme,
      improvement: stats.sum / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => b.improvement - a.improvement);

  // Calculate average conversations (count measurements per user)
  const userCounts = new Map<string, number>();
  measurements.forEach(m => {
    userCounts.set(m.userId, (userCounts.get(m.userId) || 0) + 1);
  });
  const averageConversations = Array.from(userCounts.values()).reduce((sum, count) => sum + count, 0) / userCounts.size;

  return {
    averageImprovement: Math.round(averageImprovement * 10) / 10,
    totalMeasurements: measurements.length,
    averageConversations: Math.round(averageConversations * 10) / 10,
    byTheme,
  };
}

/**
 * Get cost avoidance statistics
 */
export async function getCostAvoidanceStats(dateRange: DateRange = {}): Promise<CostAvoidanceStats> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { startDate, endDate } = dateRange;

  // Get cost configuration
  const costs = await db.select().from(costConfig);
  const costMap = new Map(costs.map(c => [c.careType, c.costAmount]));

  // Default costs if not configured
  const defaultCosts = {
    jeugd_ggz: costMap.get('jeugd_ggz') || 8000,
    specialistische_zorg: costMap.get('specialistische_zorg') || 15000,
    uithuisplaatsing: costMap.get('uithuisplaatsing') || 50000,
    veilig_thuis: costMap.get('veilig_thuis') || 5000,
  };

  // Build where conditions
  const conditions = [
    eq(referralTracking.hadReferral, false), // Only prevented referrals
    isNotNull(referralTracking.preventedCareType),
  ];

  if (startDate) {
    conditions.push(gte(referralTracking.trackedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(referralTracking.trackedAt, endDate));
  }

  // Get prevented referrals
  const preventedReferrals = await db
    .select({
      preventedCareType: referralTracking.preventedCareType,
    })
    .from(referralTracking)
    .where(and(...conditions));

  // Count by type
  const typeCounts = new Map<string, number>();
  preventedReferrals.forEach(r => {
    if (r.preventedCareType) {
      typeCounts.set(r.preventedCareType, (typeCounts.get(r.preventedCareType) || 0) + 1);
    }
  });

  const preventedJeugdGGZ = typeCounts.get('jeugd_ggz') || 0;
  const preventedCrisis = typeCounts.get('veilig_thuis') || 0;
  const preventedSpecialistCare = typeCounts.get('specialistische_zorg') || 0;
  const preventedOutOfHome = typeCounts.get('uithuisplaatsing') || 0;

  // Calculate total cost
  const totalAvoidedCost =
    preventedJeugdGGZ * defaultCosts.jeugd_ggz +
    preventedCrisis * defaultCosts.veilig_thuis +
    preventedSpecialistCare * defaultCosts.specialistische_zorg +
    preventedOutOfHome * defaultCosts.uithuisplaatsing;

  const breakdown = [
    {
      careType: 'Jeugd-GGZ',
      count: preventedJeugdGGZ,
      costPerCase: defaultCosts.jeugd_ggz,
      totalCost: preventedJeugdGGZ * defaultCosts.jeugd_ggz,
    },
    {
      careType: 'Veilig Thuis',
      count: preventedCrisis,
      costPerCase: defaultCosts.veilig_thuis,
      totalCost: preventedCrisis * defaultCosts.veilig_thuis,
    },
    {
      careType: 'Specialistische Zorg',
      count: preventedSpecialistCare,
      costPerCase: defaultCosts.specialistische_zorg,
      totalCost: preventedSpecialistCare * defaultCosts.specialistische_zorg,
    },
    {
      careType: 'Uithuisplaatsing',
      count: preventedOutOfHome,
      costPerCase: defaultCosts.uithuisplaatsing,
      totalCost: preventedOutOfHome * defaultCosts.uithuisplaatsing,
    },
  ].filter(item => item.count > 0);

  return {
    totalAvoidedCost,
    preventedJeugdGGZ,
    preventedCrisis,
    preventedSpecialistCare,
    preventedOutOfHome,
    breakdown,
  };
}

/**
 * Get escalation prevention statistics
 */
export async function getEscalationPreventionStats(dateRange: DateRange = {}): Promise<EscalationPreventionStats> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { startDate, endDate } = dateRange;

  // Build where conditions for analytics events
  const conditions = [
    eq(analyticsEvents.isHighRisk, true), // High-risk users (3+ themes)
  ];

  if (startDate) {
    conditions.push(gte(analyticsEvents.timestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(analyticsEvents.timestamp, endDate));
  }

  // Get high-risk users
  const highRiskEvents = await db
    .select({
      postalCodeArea: analyticsEvents.postalCodeArea,
      ageGroup: analyticsEvents.ageGroup,
    })
    .from(analyticsEvents)
    .where(and(...conditions));

  const highRiskUsers = highRiskEvents.length;

  // Get referrals for high-risk users (those who needed external care)
  const referralConditions = [
    eq(referralTracking.hadReferral, true),
  ];

  if (startDate) {
    referralConditions.push(gte(referralTracking.trackedAt, startDate));
  }
  if (endDate) {
    referralConditions.push(lte(referralTracking.trackedAt, endDate));
  }

  const referrals = await db
    .select()
    .from(referralTracking)
    .where(and(...referralConditions));

  const referredUsers = referrals.length;

  // Stabilized users = high-risk users who didn't need referral
  const stabilizedUsers = Math.max(0, highRiskUsers - referredUsers);
  const preventionRate = highRiskUsers > 0 ? (stabilizedUsers / highRiskUsers) * 100 : 0;

  return {
    highRiskUsers,
    stabilizedUsers,
    preventionRate: Math.round(preventionRate),
  };
}

/**
 * Initialize default cost configuration
 */
export async function initializeDefaultCosts(adminUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const defaultCosts = [
    {
      careType: 'jeugd_ggz',
      costAmount: 8000,
      description: 'Gemiddelde kosten per Jeugd-GGZ traject',
      updatedBy: adminUserId,
    },
    {
      careType: 'specialistische_zorg',
      costAmount: 15000,
      description: 'Gemiddelde kosten per specialistische zorg traject',
      updatedBy: adminUserId,
    },
    {
      careType: 'uithuisplaatsing',
      costAmount: 50000,
      description: 'Gemiddelde kosten per uithuisplaatsing per jaar',
      updatedBy: adminUserId,
    },
    {
      careType: 'veilig_thuis',
      costAmount: 5000,
      description: 'Gemiddelde kosten per Veilig Thuis interventie',
      updatedBy: adminUserId,
    },
  ];

  for (const cost of defaultCosts) {
    // Check if exists
    const existing = await db
      .select()
      .from(costConfig)
      .where(eq(costConfig.careType, cost.careType))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(costConfig).values(cost);
    }
  }
}
