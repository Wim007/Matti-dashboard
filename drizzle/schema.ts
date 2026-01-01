import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analytics events table storing anonymized usage data from Matti and Opvoedmaatje apps.
 */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  appName: mysqlEnum("appName", ["matti", "opvoedmaatje"]).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  postalCodeArea: varchar("postalCodeArea", { length: 20 }).notNull(),
  ageGroup: varchar("ageGroup", { length: 20 }).notNull(),
  userType: mysqlEnum("userType", ["jongere", "ouder"]).notNull(),
  familyType: mysqlEnum("familyType", ["eenouder", "tweeouder", "samengesteld"]),
  themes: json("themes").$type<string[]>().notNull(),
  sessionDuration: int("sessionDuration").notNull(),
  messageCount: int("messageCount").notNull(),
  isReturningUser: boolean("isReturningUser").notNull(),
  weeklyFrequency: int("weeklyFrequency").notNull(),
  referralType: mysqlEnum("referralType", ["jeugd-ggz", "wijkteam", "huisarts", "schuldhulp", "veilig-thuis"]),
  daysToReferral: int("daysToReferral"),
  satisfactionScore: int("satisfactionScore"),
  selfReportedImprovement: boolean("selfReportedImprovement"),
  isHighRisk: boolean("isHighRisk").notNull(),
  safetySignal: boolean("safetySignal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * API keys table for authenticating external apps (Matti, Opvoedmaatje).
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  appName: mysqlEnum("appName", ["matti", "opvoedmaatje"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Improvement scores table for tracking theme-based progress over time.
 * Used for "Verbetering na Matti-gesprekken" feature.
 */
export const improvementScores = mysqlTable("improvement_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(), // Anonymized user ID
  theme: varchar("theme", { length: 100 }).notNull(), // pesten, stress, school, etc.
  scoreStart: int("scoreStart").notNull(), // 1-10 initial score
  scoreCurrent: int("scoreCurrent"), // 1-10 current score (null until follow-up)
  measuredAt: timestamp("measuredAt").notNull(),
  followUpAt: timestamp("followUpAt"), // When follow-up score was recorded
  appName: mysqlEnum("appName", ["matti", "opvoedmaatje"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImprovementScore = typeof improvementScores.$inferSelect;
export type InsertImprovementScore = typeof improvementScores.$inferInsert;

/**
 * Referral tracking table for cost avoidance calculations.
 */
export const referralTracking = mysqlTable("referral_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(), // Anonymized user ID
  hadReferral: boolean("hadReferral").notNull(), // Whether user was referred to external care
  preventedCareType: mysqlEnum("preventedCareType", [
    "jeugd_ggz",
    "veilig_thuis",
    "specialistische_zorg",
    "uithuisplaatsing"
  ]), // Type of care that was prevented (null if hadReferral = true)
  appName: mysqlEnum("appName", ["matti", "opvoedmaatje"]).notNull(),
  trackedAt: timestamp("trackedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralTracking = typeof referralTracking.$inferSelect;
export type InsertReferralTracking = typeof referralTracking.$inferInsert;

/**
 * Cost configuration table for customizable regional pricing.
 */
export const costConfig = mysqlTable("cost_config", {
  id: int("id").autoincrement().primaryKey(),
  careType: varchar("careType", { length: 100 }).notNull().unique(),
  costAmount: int("costAmount").notNull(), // Cost in euros
  description: text("description"),
  updatedBy: int("updatedBy").notNull().references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostConfig = typeof costConfig.$inferSelect;
export type InsertCostConfig = typeof costConfig.$inferInsert;
