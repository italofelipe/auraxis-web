/**
 * Common Zod schemas for Brazilian document fields and financial values.
 *
 * These schemas are built on top of the validator functions in
 * `~/utils/validators` so that form libraries (vee-validate + @vee-validate/zod)
 * and standalone parse calls share the same validation logic.
 */

import { z } from "zod";

import { isCNPJ, isCPF, isPhone } from "~/utils/validators";

/**
 * Zod schema that validates a Brazilian CPF (masked or raw).
 *
 * @example
 * cpfSchema.parse("529.982.247-25")  // ok
 * cpfSchema.parse("000.000.000-00")  // throws ZodError
 */
export const cpfSchema = z
  .string()
  .min(1, "Informe o CPF.")
  .refine(isCPF, "Informe um CPF válido.");

/**
 * Zod schema that validates a Brazilian CNPJ (masked or raw).
 *
 * @example
 * cnpjSchema.parse("11.222.333/0001-81")  // ok
 * cnpjSchema.parse("00.000.000/0000-00")  // throws ZodError
 */
export const cnpjSchema = z
  .string()
  .min(1, "Informe o CNPJ.")
  .refine(isCNPJ, "Informe um CNPJ válido.");

/**
 * Zod schema that validates a Brazilian phone number (mobile or landline,
 * masked or raw).
 *
 * @example
 * phoneSchema.parse("(11) 91234-5678")  // ok
 * phoneSchema.parse("00000000000")       // throws ZodError
 */
export const phoneSchema = z
  .string()
  .min(1, "Informe o telefone.")
  .refine(isPhone, "Informe um telefone válido (com DDD).");

/**
 * Zod schema for a non-negative monetary value (BRL).
 *
 * Accepts numbers and numeric strings (via `z.coerce`) to support form
 * inputs that deliver strings.
 *
 * @example
 * currencySchema.parse(1234.56)   // 1234.56
 * currencySchema.parse("50")      // 50
 * currencySchema.parse(-1)        // throws ZodError
 */
export const currencySchema = z.coerce
  .number({ invalid_type_error: "Informe um valor válido." })
  .nonnegative("O valor não pode ser negativo.");

/**
 * Zod schema for an ISO-8601 date string in `YYYY-MM-DD` format.
 *
 * @example
 * dateSchema.parse("2026-03-28")  // ok
 * dateSchema.parse("28/03/2026")  // throws ZodError
 */
export const dateSchema = z
  .string()
  .min(1, "Informe a data.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato AAAA-MM-DD.");

/** Inferred TypeScript type for {@link cpfSchema}. */
export type CpfSchema = z.infer<typeof cpfSchema>;

/** Inferred TypeScript type for {@link cnpjSchema}. */
export type CnpjSchema = z.infer<typeof cnpjSchema>;

/** Inferred TypeScript type for {@link phoneSchema}. */
export type PhoneSchema = z.infer<typeof phoneSchema>;

/** Inferred TypeScript type for {@link currencySchema}. */
export type CurrencySchema = z.infer<typeof currencySchema>;

/** Inferred TypeScript type for {@link dateSchema}. */
export type DateSchema = z.infer<typeof dateSchema>;
