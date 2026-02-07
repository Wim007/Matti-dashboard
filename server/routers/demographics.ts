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
  ageGroup: z.enum(['12-14', '15-17', '18-21']).optional(),
});

export const demographicsRouter = router({
  ageGroups: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getDemographicsByAgeGroup(filters);
  }),

  postalCodes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getDemographicsByPostalCode(filters);
  }),

  userTypes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getDemographicsByUserType(filters);
  }),

  familyTypes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getDemographicsByFamilyType(filters);
  }),

  themes: adminProcedure.input(filtersSchema).query(async ({ input }) => {
    const filters = {
      appName: input.appName,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      ageGroup: input.ageGroup,
    };
    return await getThemeFrequency(filters);
  }),
});
