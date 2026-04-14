import { z } from "zod";

/**
 * Zod input validation schema for the thirteenth-salary calculator form.
 *
 * Used in addition to the domain-level validateThirteenthSalaryForm() checks
 * to provide runtime type safety at form-boundary.
 */
export const thirteenthSalarySchema = z.object({
  /** Monthly gross salary in BRL. Must be positive. */
  grossSalary: z.number({ required_error: "errors.grossSalaryRequired" })
    .positive({ message: "errors.grossSalaryRequired" }),

  /** Number of months worked in the reference year (1–12). */
  monthsWorked: z.number()
    .int()
    .min(1, { message: "errors.monthsWorkedRange" })
    .max(12, { message: "errors.monthsWorkedRange" }),

  /** Average monthly variable pay (overtime bonuses, etc.) in BRL. */
  variablePay: z.number().min(0).default(0),

  /** Advance already received (e.g., paid during vacation) in BRL. */
  advancePaid: z.number().min(0).default(0),

  /** Number of declared dependents for IRRF deduction. */
  dependents: z.number().int().min(0).max(10).default(0),
});

export type ThirteenthSalarySchemaInput = z.input<typeof thirteenthSalarySchema>;
export type ThirteenthSalarySchemaOutput = z.output<typeof thirteenthSalarySchema>;
