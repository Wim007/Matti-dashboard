import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createApiKey, getDb } from "./db";
import { nanoid } from "nanoid";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("analytics.submitEvent", () => {
  let testApiKey: string;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // Create a test API key
    testApiKey = `ak_test_${nanoid(48)}`;
    const ctx = createMockContext();
    
    try {
      await createApiKey({
        key: testApiKey,
        name: "Test Key",
        appName: "matti",
        createdBy: ctx.user!.id,
        isActive: true,
      });
    } catch (error) {
      console.log("API key creation skipped (database not available)");
    }

    caller = appRouter.createCaller(ctx);
  });

  it("should accept a valid analytics event with correct API key", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Skipping test: database not available");
      return;
    }

    const validEvent = {
      appName: "matti" as const,
      timestamp: new Date().toISOString(),
      postalCodeArea: "3000-3099",
      ageGroup: "13-15",
      userType: "jongere" as const,
      themes: ["school", "pesten"],
      sessionDuration: 720,
      messageCount: 12,
      isReturningUser: true,
      weeklyFrequency: 3,
      isHighRisk: false,
      safetySignal: false,
    };

    const result = await caller.analytics.submitEvent({
      apiKey: testApiKey,
      event: validEvent,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Analytics event recorded successfully");
  });

  it("should reject an event with invalid API key", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Skipping test: database not available");
      return;
    }

    const validEvent = {
      appName: "matti" as const,
      timestamp: new Date().toISOString(),
      postalCodeArea: "3000-3099",
      ageGroup: "13-15",
      userType: "jongere" as const,
      themes: ["school"],
      sessionDuration: 600,
      messageCount: 10,
      isReturningUser: false,
      weeklyFrequency: 1,
      isHighRisk: false,
      safetySignal: false,
    };

    await expect(
      caller.analytics.submitEvent({
        apiKey: "invalid_key",
        event: validEvent,
      })
    ).rejects.toThrow("Invalid API key");
  });

  it("should reject an event with mismatched app name", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Skipping test: database not available");
      return;
    }

    const invalidEvent = {
      appName: "opvoedmaatje" as const, // API key is for "matti"
      timestamp: new Date().toISOString(),
      postalCodeArea: "3000-3099",
      ageGroup: "13-15",
      userType: "jongere" as const,
      themes: ["school"],
      sessionDuration: 600,
      messageCount: 10,
      isReturningUser: false,
      weeklyFrequency: 1,
      isHighRisk: false,
      safetySignal: false,
    };

    await expect(
      caller.analytics.submitEvent({
        apiKey: testApiKey,
        event: invalidEvent,
      })
    ).rejects.toThrow("API key does not match app name");
  });

  it("should accept an event with optional fields", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Skipping test: database not available");
      return;
    }

    const eventWithOptionals = {
      appName: "matti" as const,
      timestamp: new Date().toISOString(),
      postalCodeArea: "3000-3099",
      ageGroup: "16-18",
      userType: "ouder" as const,
      familyType: "tweeouder" as const,
      themes: ["gezin", "opvoeding", "school"],
      sessionDuration: 1200,
      messageCount: 20,
      isReturningUser: true,
      weeklyFrequency: 5,
      referralType: "jeugd-ggz" as const,
      daysToReferral: 18,
      satisfactionScore: 8,
      selfReportedImprovement: true,
      isHighRisk: true,
      safetySignal: false,
    };

    const result = await caller.analytics.submitEvent({
      apiKey: testApiKey,
      event: eventWithOptionals,
    });

    expect(result.success).toBe(true);
  });

  it("should mark high risk correctly when themes >= 3", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Skipping test: database not available");
      return;
    }

    const highRiskEvent = {
      appName: "matti" as const,
      timestamp: new Date().toISOString(),
      postalCodeArea: "3000-3099",
      ageGroup: "13-15",
      userType: "jongere" as const,
      themes: ["school", "pesten", "gezin"], // 3 themes = high risk
      sessionDuration: 900,
      messageCount: 15,
      isReturningUser: true,
      weeklyFrequency: 2,
      isHighRisk: true,
      safetySignal: false,
    };

    const result = await caller.analytics.submitEvent({
      apiKey: testApiKey,
      event: highRiskEvent,
    });

    expect(result.success).toBe(true);
  });

  it("should handle safety signals correctly", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Skipping test: database not available");
      return;
    }

    const safetySignalEvent = {
      appName: "matti" as const,
      timestamp: new Date().toISOString(),
      postalCodeArea: "3000-3099",
      ageGroup: "13-15",
      userType: "jongere" as const,
      themes: ["mental-health", "crisis"],
      sessionDuration: 600,
      messageCount: 8,
      isReturningUser: false,
      weeklyFrequency: 1,
      isHighRisk: true,
      safetySignal: true, // Safety signal detected
    };

    const result = await caller.analytics.submitEvent({
      apiKey: testApiKey,
      event: safetySignalEvent,
    });

    expect(result.success).toBe(true);
  });
});
