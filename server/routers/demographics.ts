import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getDemographicsByAgeGroup,
  getDemographicsByFamilyType,
  getDemographicsByPostalCode,
  getDemographicsByUserType,
  getThemeFrequency,
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

export const demographicsRouter = router({
  ageGroups: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getDemographicsByAgeGroup(filters);
  }),

  postalCodes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getDemographicsByPostalCode(filters);
  }),

  userTypes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getDemographicsByUserType(filters);
  }),

  familyTypes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getDemographicsByFamilyType(filters);
  }),

  themes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };
    return await getThemeFrequency(filters);
  }),
});
