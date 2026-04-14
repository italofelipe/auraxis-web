import { z } from "zod";
import { CLT_DEFAULT_HOURS_PER_MONTH } from "~/features/tools/model/hora-extra";

/**
 * Zod input validation schema for the Hora Extra calculator form.
 *
 * Provides runtime type safety at the form boundary.
 * Domain-level validation (validateHoraExtraForm) runs after this.
 */
export const horaExtraSchema = z.object({
  /** Monthly gross base salary in BRL. Must be positive. */
  grossSalary: z.number({ required_error: "errors.grossSalaryRequired" })
    .positive({ message: "errors.grossSalaryRequired" }),

  /** Monthly working hours used to derive hourly rate. */
  hoursPerMonth: z.number()
    .positive({ message: "errors.hoursPerMonthInvalid" })
    .default(CLT_DEFAULT_HOURS_PER_MONTH),

  /** Number of overtime hours at 50% rate. */
  hours50: z.number().min(0, { message: "errors.hoursNegative" }).default(0),

  /** Number of overtime hours at 75% rate. */
  hours75: z.number().min(0, { message: "errors.hoursNegative" }).default(0),

  /** Number of overtime hours at 100% rate. */
  hours100: z.number().min(0, { message: "errors.hoursNegative" }).default(0),
}).refine(
  (data) => data.hours50 > 0 || data.hours75 > 0 || data.hours100 > 0,
  { message: "errors.noOvertimeHours", path: ["hours50"] },
);

export type HoraExtraSchemaInput = z.input<typeof horaExtraSchema>;
export type HoraExtraSchemaOutput = z.output<typeof horaExtraSchema>;
