import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { 
  getImprovementStats, 
  getCostAvoidanceStats, 
  getEscalationPreventionStats,
  initializeDefaultCosts 
} from "../db-funding";
import { protectedProcedure, router } from "../_core/trpc";

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const fundingRouter = router({
  // Get improvement statistics (Verbetering na Matti-gesprekken)
  getImprovementStats: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const dateRange = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      return await getImprovementStats(dateRange);
    }),

  // Get cost avoidance statistics (Vermeden Zorgkosten)
  getCostAvoidance: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const dateRange = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      return await getCostAvoidanceStats(dateRange);
    }),

  // Get escalation prevention statistics (Escalatie Voorkomen)
  getEscalationPrevention: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const dateRange = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      return await getEscalationPreventionStats(dateRange);
    }),

  // Initialize default cost configuration
  initializeDefaultCosts: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      await initializeDefaultCosts(ctx.user.id);

      return {
        success: true,
        message: "Default cost configuration initialized",
      };
    }),
});
