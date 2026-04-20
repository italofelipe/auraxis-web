import { z } from "zod";

/**
 * Type alias for the translation function passed to schema factories.
 * Supports both simple keys and keys with named parameters.
 */
type TFunction = (key: string, params?: Record<string, string | number>) => string;

// ── Private helpers ────────────────────────────────────────────────────────

/**
 * Strips all non-digit characters from a string.
 *
 * @param value - Input string.
 * @returns String containing only digit characters.
 */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validates a Brazilian CPF number.
 * Accepts raw or formatted input; performs check-digit verification.
 *
 * @param raw - CPF string (formatted or raw digits).
 * @returns True when the CPF passes structural and check-digit validation.
 */
function isValidCpf(raw: string): boolean {
  const digits = digitsOnly(raw);
  if (digits.length !== 11) {
    return false;
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  /**
   * Computes a CPF check digit for the given slice.
   *
   * @param slice - Digit substring to evaluate.
   * @param factor - Starting weight factor.
   * @returns Computed check digit (0–9).
   */
  const calcDigit = (slice: string, factor: number): number => {
    const sum = slice
      .split("")
      .reduce((acc, ch, i) => acc + parseInt(ch, 10) * (factor - i), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  const first = calcDigit(digits.slice(0, 9), 10);
  const ninth = digits[9];
  if (ninth === undefined || first !== parseInt(ninth, 10)) {
    return false;
  }
  const second = calcDigit(digits.slice(0, 10), 11);
  const tenth = digits[10];
  return tenth !== undefined && second === parseInt(tenth, 10);
}

/**
 * Validates a Brazilian CNPJ number.
 * Accepts raw or formatted input; performs check-digit verification.
 *
 * @param raw - CNPJ string (formatted or raw digits).
 * @returns True when the CNPJ passes structural and check-digit validation.
 */
function isValidCnpj(raw: string): boolean {
  const digits = digitsOnly(raw);
  if (digits.length !== 14) {
    return false;
  }
  if (/^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  /**
   * Computes a CNPJ check digit for the given slice and weight array.
   *
   * @param slice - Digit substring to evaluate.
   * @param weights - Weight array aligned with the slice.
   * @returns Computed check digit (0–9).
   */
  const calcDigit = (slice: string, weights: number[]): number => {
    const sum = slice
      .split("")
      .reduce((acc, ch, i) => acc + parseInt(ch, 10) * (weights[i] ?? 0), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const first = calcDigit(digits.slice(0, 12), w1);
  const twelfth = digits[12];
  if (twelfth === undefined || first !== parseInt(twelfth, 10)) {
    return false;
  }
  const second = calcDigit(digits.slice(0, 13), w2);
  const thirteenth = digits[13];
  return thirteenth !== undefined && second === parseInt(thirteenth, 10);
}

/**
 * Validates a Brazilian phone number by digit count.
 *
 * @param raw - Phone string (formatted or raw digits).
 * @returns True for 10-digit (landline) or 11-digit (mobile) numbers.
 */
function isValidPhone(raw: string): boolean {
  const digits = digitsOnly(raw);
  return digits.length === 10 || digits.length === 11;
}

// ── Factory schemas ────────────────────────────────────────────────────────

/**
 * Creates a CPF validation schema with i18n-aware messages.
 * Accepts formatted (000.000.000-00) or raw (00000000000) input.
 * Output is always the raw 11-digit string.
 *
 * @param t - vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema that validates and transforms a CPF string.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export const createCpfSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t("validation.cpf.required"))
    .refine((v) => digitsOnly(v).length === 11, t("validation.cpf.format"))
    .refine((v) => isValidCpf(v), t("validation.cpf.invalid"))
    .transform((v) => digitsOnly(v));

/**
 * Creates a CNPJ validation schema with i18n-aware messages.
 * Accepts formatted (00.000.000/0000-00) or raw (00000000000000) input.
 * Output is always the raw 14-digit string.
 *
 * @param t - vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema that validates and transforms a CNPJ string.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export const createCnpjSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t("validation.cnpj.required"))
    .refine((v) => digitsOnly(v).length === 14, t("validation.cnpj.format"))
    .refine((v) => isValidCnpj(v), t("validation.cnpj.invalid"))
    .transform((v) => digitsOnly(v));

/**
 * Creates a Brazilian phone number validation schema with i18n-aware messages.
 * Accepts formatted or raw input; output is always digits-only.
 * Valid lengths: 10 digits (landline) or 11 digits (mobile).
 *
 * @param t - vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema that validates and transforms a phone string.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export const createPhoneSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t("validation.phone.required"))
    .refine((v) => isValidPhone(v), t("validation.phone.invalid"))
    .transform((v) => digitsOnly(v));

/**
 * Creates a currency value validation schema with i18n-aware messages.
 * Accepts numbers or numeric strings (using comma or dot as decimal separator).
 * Output is always a non-negative number.
 *
 * @param t - vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema that validates and transforms a currency value.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export const createCurrencySchema = (t: TFunction) =>
  z
    .union([
      z.number({ invalid_type_error: t("validation.currency.invalid") }),
      z.string().trim().min(1, t("validation.currency.required")),
    ])
    .transform((v, ctx): number => {
      const num =
        typeof v === "number"
          ? v
          : parseFloat(String(v).replace(",", "."));
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.currency.invalid"),
        });
        return z.NEVER;
      }
      return num;
    })
    .refine((n) => n >= 0, t("validation.currency.negative"));

/**
 * Creates an ISO 8601 date (YYYY-MM-DD) validation schema with i18n-aware messages.
 *
 * @param t - vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema that validates a YYYY-MM-DD date string.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export const createIsoDateSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      t("validation.isoDate.format"),
    );

/**
 * Pagination parameters schema (no i18n needed — developer-facing).
 * Validates page (positive integer) and limit (1–100 integer).
 */
export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().min(1).max(100),
});

// ── Static fallback schemas (hardcoded PT-BR) ──────────────────────────────
// Retained for backward-compatibility with code that imports the plain schemas
// without going through a setup() context.
// Prefer the factory functions above for all new and updated components.

/** @deprecated Use createCpfSchema(t) inside setup() instead. */
export const cpfSchema = createCpfSchema((key) =>
  (
    ({
      "validation.cpf.required": "Informe o CPF.",
      "validation.cpf.format": "CPF deve conter 11 dígitos.",
      "validation.cpf.invalid": "CPF inválido.",
    }) as Record<string, string>
  )[key] ?? key,
);

/** @deprecated Use createCnpjSchema(t) inside setup() instead. */
export const cnpjSchema = createCnpjSchema((key) =>
  (
    ({
      "validation.cnpj.required": "Informe o CNPJ.",
      "validation.cnpj.format": "CNPJ deve conter 14 dígitos.",
      "validation.cnpj.invalid": "CNPJ inválido.",
    }) as Record<string, string>
  )[key] ?? key,
);

/** @deprecated Use createPhoneSchema(t) inside setup() instead. */
export const phoneSchema = createPhoneSchema((key) =>
  (
    ({
      "validation.phone.required": "Informe o telefone.",
      "validation.phone.invalid": "Telefone inválido. Use (11) 99999-9999 ou (11) 9999-9999.",
    }) as Record<string, string>
  )[key] ?? key,
);

/** @deprecated Use createCurrencySchema(t) inside setup() instead. */
export const currencySchema = createCurrencySchema((key) =>
  (
    ({
      "validation.currency.required": "Informe o valor.",
      "validation.currency.invalid": "Informe um valor numérico válido.",
      "validation.currency.negative": "O valor não pode ser negativo.",
    }) as Record<string, string>
  )[key] ?? key,
);

/** @deprecated Use createIsoDateSchema(t) inside setup() instead. */
export const isoDateSchema = createIsoDateSchema((key) =>
  (
    ({
      "validation.isoDate.format": "Data deve estar no formato AAAA-MM-DD.",
    }) as Record<string, string>
  )[key] ?? key,
);

export type PaginationSchema = z.infer<typeof paginationSchema>;
