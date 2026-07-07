import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getApiKeyByKey, getAnalyticsEvents, getAnalyticsSummary, getSchools, insertAnalyticsEvent, updateApiKeyLastUsed } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const analyticsEventSchema = z.object({
  appName: z.enum(["matti", "opvoedmaatje"]),
  timestamp: z.string().datetime(),
  postalCodeArea: z.string().min(1).max(20),
  ageGroup: z.string().min(1).max(20),
  userType: z.enum(["jongere", "ouder"]),
  familyType: z.enum(["eenouder", "tweeouder", "samengesteld"]).optional(),
  themes: z.array(z.string()).min(1),
  sessionDuration: z.number().int().min(0),
  messageCount: z.number().int().min(0),
  isReturningUser: z.boolean(),
  weeklyFrequency: z.number().int().min(0),
  referralType: z.enum(["jeugd-ggz", "wijkteam", "huisarts", "schuldhulp", "veilig-thuis"]).optional(),
  daysToReferral: z.number().int().min(0).optional(),
  satisfactionScore: z.number().int().min(1).max(10).optional(),
  selfReportedImprovement: z.boolean().optional(),
  isHighRisk: z.boolean(),
  safetySignal: z.boolean(),
});

const analyticsFilterSchema = z.object({
  appName: z.enum(["matti", "opvoedmaatje"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

export const analyticsRouter = router({
  // Public endpoint for external apps to submit analytics events
  submitEvent: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        event: analyticsEventSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate API key
        const apiKeyRecord = await getApiKeyByKey(input.apiKey);
        if (!apiKeyRecord) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid API key",
          });
        }

        // Verify app name matches API key
        if (apiKeyRecord.appName !== input.event.appName) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "API key does not match app name",
          });
        }

        // Insert analytics event
        await insertAnalyticsEvent({
          ...input.event,
          timestamp: new Date(input.event.timestamp),
        });

        // Update last used timestamp
        await updateApiKeyLastUsed(apiKeyRecord.id);

        return {
          success: true,
          message: "Analytics event recorded successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("[Analytics] Failed to submit event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record analytics event",
        });
      }
    }),

  // Protected endpoints for dashboard
  getEvents: protectedProcedure
    .input(analyticsFilterSchema)
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const filters = {
        appName: input.appName,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        limit: input.limit,
      };

      return await getAnalyticsEvents(filters);
    }),

  getSummary: protectedProcedure
    .input(
      z.object({
        appName: z.enum(["matti", "opvoedmaatje"]).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        school: z.string().max(120).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const filters = {
        appName: input.appName,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        school: input.school,
      };

      return await getAnalyticsSummary(filters);
    }),

  // Scholenlijst voor de schoolkiezer in het menu
  getSchools: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }
    return await getSchools();
  }),
});
