import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSchool, deleteSchool, getSchools, listRegisteredSchools, renameSchool } from "../db";
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

const schoolName = z.string().trim().min(2).max(120);

/**
 * Scholenbeheer: schooldirecteuren/-medewerkers beheren hier de canonieke
 * schoolnaam. Hernoemen werkt alle bestaande events mee bij, zodat losse
 * spellingen samengevoegd kunnen worden en de historie zichtbaar blijft.
 */
export const schoolsRouter = router({
  // Register (beheerde lijst)
  listRegistered: adminProcedure.query(async () => {
    return await listRegisteredSchools();
  }),

  // Register + labels die al in events voorkomen (voor samenvoegen)
  listAll: adminProcedure.query(async () => {
    return await getSchools();
  }),

  create: adminProcedure
    .input(z.object({ name: schoolName }))
    .mutation(async ({ input }) => {
      try {
        await createSchool(input.name);
      } catch (err: any) {
        if (String(err?.message ?? err).includes("Duplicate")) {
          throw new TRPCError({ code: "CONFLICT", message: "Deze school bestaat al" });
        }
        throw err;
      }
      return { success: true };
    }),

  rename: adminProcedure
    .input(z.object({ oldName: schoolName, newName: schoolName }))
    .mutation(async ({ input }) => {
      if (input.oldName === input.newName) return { success: true };
      await renameSchool(input.oldName, input.newName);
      return { success: true };
    }),

  remove: adminProcedure
    .input(z.object({ name: schoolName }))
    .mutation(async ({ input }) => {
      await deleteSchool(input.name);
      return { success: true };
    }),
});
