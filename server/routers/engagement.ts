import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getMessageCountTimeSeries,
  getReferralDistribution,
  getRiskMetrics,
  getSessionDurationTimeSeries,
} from "../db-analytics";
import { protectedProcedure, router } from "../_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

const filtersSchema = z.object({
  appName: z.enum(["matti", "opvoedmaatje"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const engagementRouter = router({
  sessionDuration: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getSessionDurationTimeSeries(filters);
  }),

  messageCount: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getMessageCountTimeSeries(filters);
  }),

  referrals: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getReferralDistribution(filters);
  }),

  riskMetrics: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getRiskMetrics(filters);
  }),
});
