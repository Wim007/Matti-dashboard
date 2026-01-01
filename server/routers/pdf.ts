/**
 * PDF Export Router
 * Handles PDF generation for Impact Report
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { collectReportData, generateReportHTML } from "../pdf-export";

export const pdfRouter = router({
  /**
   * Generate Impact Report HTML for PDF export
   */
  generateImpactReport: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const data = await collectReportData(input.startDate, input.endDate);
      const html = generateReportHTML(data);
      
      return {
        html,
        data,
      };
    }),
});
