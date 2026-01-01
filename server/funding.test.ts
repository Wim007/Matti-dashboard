import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, improvementScores, referralTracking, costConfig } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Funding Router", () => {
  let testUserId: number;
  let adminContext: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create or get test admin user
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test_admin_funding"))
      .limit(1);

    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
    } else {
      const result = await db.insert(users).values({
        openId: "test_admin_funding",
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
      });
      testUserId = Number(result.insertId);
    }

    // Ensure testUserId is valid
    if (!testUserId || isNaN(testUserId)) {
      throw new Error("Failed to create or retrieve test user");
    }

    adminContext = {
      user: {
        id: testUserId,
        openId: "test_admin_funding",
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin" as const,
      },
    };

    // Initialize cost config
    await db.insert(costConfig).values([
      { careType: "jeugd_ggz", costAmount: 8000, description: "Test", updatedBy: testUserId },
      { careType: "specialistische_zorg", costAmount: 15000, description: "Test", updatedBy: testUserId },
      { careType: "uithuisplaatsing", costAmount: 50000, description: "Test", updatedBy: testUserId },
      { careType: "veilig_thuis", costAmount: 5000, description: "Test", updatedBy: testUserId },
    ]).onDuplicateKeyUpdate({ set: { careType: costConfig.careType } });
  });

  describe("getImprovementStats", () => {
    it("should return improvement statistics", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      const result = await caller.funding.getImprovementStats({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      expect(result).toBeDefined();
      expect(typeof result.averageImprovement).toBe("number");
      expect(typeof result.totalMeasurements).toBe("number");
      expect(typeof result.averageConversations).toBe("number");
      expect(Array.isArray(result.byTheme)).toBe(true);
      
      // If we have test data, check it's reasonable
      if (result.totalMeasurements > 0) {
        expect(result.averageImprovement).toBeGreaterThanOrEqual(0);
        expect(result.averageImprovement).toBeLessThanOrEqual(100);
        expect(result.averageConversations).toBeGreaterThan(0);
      }
    });

    it("should return empty stats when no data exists", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      // Query a date range with no data
      const result = await caller.funding.getImprovementStats({
        startDate: new Date("2020-01-01").toISOString(),
        endDate: new Date("2020-01-02").toISOString(),
      });

      expect(result.averageImprovement).toBe(0);
      expect(result.totalMeasurements).toBe(0);
      expect(result.byTheme).toEqual([]);
    });
  });

  describe("getCostAvoidance", () => {
    it("should calculate cost avoidance correctly", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      const result = await caller.funding.getCostAvoidance({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      expect(result).toBeDefined();
      expect(typeof result.totalAvoidedCost).toBe("number");
      expect(typeof result.preventedJeugdGGZ).toBe("number");
      expect(typeof result.preventedCrisis).toBe("number");
      expect(typeof result.preventedSpecialistCare).toBe("number");
      expect(typeof result.preventedOutOfHome).toBe("number");
      expect(Array.isArray(result.breakdown)).toBe(true);
      
      // Cost should be non-negative
      expect(result.totalAvoidedCost).toBeGreaterThanOrEqual(0);
      
      // Breakdown should match total
      if (result.breakdown.length > 0) {
        const breakdownTotal = result.breakdown.reduce((sum, item) => sum + item.totalCost, 0);
        expect(breakdownTotal).toBe(result.totalAvoidedCost);
      }
    });

    it("should use configured cost amounts", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      const result = await caller.funding.getCostAvoidance({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      // Check that breakdown uses correct cost per case
      result.breakdown.forEach(item => {
        if (item.careType === "Jeugd-GGZ") {
          expect(item.costPerCase).toBe(8000);
        } else if (item.careType === "Specialistische Zorg") {
          expect(item.costPerCase).toBe(15000);
        } else if (item.careType === "Uithuisplaatsing") {
          expect(item.costPerCase).toBe(50000);
        } else if (item.careType === "Veilig Thuis") {
          expect(item.costPerCase).toBe(5000);
        }
      });
    });
  });

  describe("getEscalationPrevention", () => {
    it("should calculate escalation prevention rate", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      const result = await caller.funding.getEscalationPrevention({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      expect(result).toBeDefined();
      expect(typeof result.highRiskUsers).toBe("number");
      expect(typeof result.stabilizedUsers).toBe("number");
      expect(typeof result.preventionRate).toBe("number");
      
      // Prevention rate should be 0-100%
      expect(result.preventionRate).toBeGreaterThanOrEqual(0);
      expect(result.preventionRate).toBeLessThanOrEqual(100);
      
      // Stabilized users should not exceed high-risk users
      expect(result.stabilizedUsers).toBeLessThanOrEqual(result.highRiskUsers);
    });
  });

  describe("initializeDefaultCosts", () => {
    it("should initialize default cost configuration", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      const result = await caller.funding.initializeDefaultCosts();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Default cost configuration initialized");
      
      // Verify costs were created
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const costs = await db.select().from(costConfig);
      expect(costs.length).toBeGreaterThanOrEqual(4);
      
      // Check specific costs exist
      const jeugdGGZ = costs.find(c => c.careType === "jeugd_ggz");
      expect(jeugdGGZ).toBeDefined();
      expect(jeugdGGZ?.costAmount).toBe(8000);
    });
  });

  describe("Authorization", () => {
    it("should reject non-admin users", async () => {
      const userContext = {
        user: {
          id: testUserId,
          openId: "test_user",
          name: "Test User",
          email: "user@test.com",
          role: "user" as const,
        },
      };
      
      const caller = appRouter.createCaller(userContext);
      
      await expect(
        caller.funding.getImprovementStats({})
      ).rejects.toThrow("Admin access required");
      
      await expect(
        caller.funding.getCostAvoidance({})
      ).rejects.toThrow("Admin access required");
      
      await expect(
        caller.funding.getEscalationPrevention({})
      ).rejects.toThrow("Admin access required");
    });
  });
});
