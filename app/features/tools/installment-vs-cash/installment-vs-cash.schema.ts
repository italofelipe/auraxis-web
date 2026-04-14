import { z } from "zod";

/**
 * Zod schema for the Installment vs Cash calculator form state.
 *
 * This schema provides runtime type safety at form-boundary.
 * Domain-level validation (validateInstallmentVsCashForm) runs after this.
 */
export const installmentVsCashSchema = z.object({
  /** Optional scenario label for display purposes. */
  scenarioLabel: z.string().default(""),

  /** Cash price of the item in BRL. Must be positive. */
  cashPrice: z.number().positive({ message: "Informe um preço à vista maior que zero." }).nullable(),

  /** Number of installments. Minimum 1. */
  installmentCount: z.number().int().min(1).nullable(),

  /** Input mode: by installment amount or by total. */
  installmentInputMode: z.enum(["amount", "total"]),

  /** Individual installment amount (used when mode = "amount"). */
  installmentAmount: z.number().positive().nullable(),

  /** Total installment sum (used when mode = "total"). */
  installmentTotal: z.number().positive().nullable(),

  /** Preset for when the first installment is due. */
  firstPaymentDelayPreset: z.enum(["today", "30_days", "45_days", "custom"]),

  /** Custom delay in days (required when preset = "custom"). */
  customFirstPaymentDelayDays: z.number().int().min(0).nullable(),

  /** Source for the opportunity rate. */
  opportunityRateType: z.enum(["manual", "product_default", "inflation_only"]),

  /** Annual opportunity rate in percent (required when type = "manual"). */
  opportunityRateAnnual: z.number().min(0).nullable(),

  /** Annual inflation rate assumption in percent. */
  inflationRateAnnual: z.number().min(0).nullable(),

  /** Whether upfront fees are included. */
  feesEnabled: z.boolean(),

  /** Upfront fees amount in BRL (required when feesEnabled = true). */
  feesUpfront: z.number().min(0).nullable(),
});

export type InstallmentVsCashSchemaInput = z.input<typeof installmentVsCashSchema>;
export type InstallmentVsCashSchemaOutput = z.output<typeof installmentVsCashSchema>;
