import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getBehaviorChangeByInitialConcern,
  getBehaviorChangeROI,
  getBehaviorChangeTimeline,
  getScreenTimeToActionMetrics,
} from "../db-behavior";
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
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ageGroup: z.enum(['12-14', '15-17', '18-21']).optional(),
});

export const behaviorRouter = router({
  screenTimeToAction: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getScreenTimeToActionMetrics(filters);
  }),

  byInitialConcern: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getBehaviorChangeByInitialConcern(filters);
  }),

  timeline: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getBehaviorChangeTimeline(filters);
  }),

  roi: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getBehaviorChangeROI(filters);
  }),
});
