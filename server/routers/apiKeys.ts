import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createApiKey, getAllApiKeys, toggleApiKeyStatus } from "../db";
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

export const apiKeysRouter = router({
  list: adminProcedure.query(async () => {
    return await getAllApiKeys();
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        appName: z.enum(["matti", "opvoedmaatje"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const key = `ak_${nanoid(48)}`;

      await createApiKey({
        key,
        name: input.name,
        appName: input.appName,
        createdBy: ctx.user.id,
        isActive: true,
      });

      return {
        success: true,
        key,
        message: "API key created successfully",
      };
    }),

  toggle: adminProcedure
    .input(
      z.object({
        keyId: z.number().int().min(1),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      await toggleApiKeyStatus(input.keyId, input.isActive);

      return {
        success: true,
        message: `API key ${input.isActive ? "activated" : "deactivated"} successfully`,
      };
    }),
});
