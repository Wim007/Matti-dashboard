import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { analyticsRouter } from "./routers/analytics";
import { apiKeysRouter } from "./routers/apiKeys";
import { demographicsRouter } from "./routers/demographics";
import { engagementRouter } from "./routers/engagement";
import { fundingRouter } from "./routers/funding";
import { pdfRouter } from "./routers/pdf";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  analytics: analyticsRouter,
  demographics: demographicsRouter,
  engagement: engagementRouter,
  funding: fundingRouter,
  pdf: pdfRouter,
  apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;
