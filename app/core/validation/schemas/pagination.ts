/**
 * Zod schemas for API pagination parameters.
 *
 * Provides a typed, validated shape for query-string pagination inputs
 * consumed by feature-level composables and API modules.
 */

import { z } from "zod";

/** Default page number used when `page` is not supplied. */
const DEFAULT_PAGE = 1;

/** Default number of items per page when `limit` is not supplied. */
const DEFAULT_LIMIT = 20;

/**
 * Zod schema for standard pagination query parameters.
 *
 * Both `page` and `limit` accept numbers or numeric strings (via `z.coerce`)
 * so they can be used directly with URL query params.
 *
 * - `page` must be a positive integer (≥ 1); defaults to `1`.
 * - `limit` must be between `1` and `100` (inclusive); defaults to `20`.
 *
 * @example
 * paginationParamsSchema.parse({ page: 2, limit: 10 })
 * // { page: 2, limit: 10 }
 *
 * paginationParamsSchema.parse({})
 * // { page: 1, limit: 20 }
 *
 * paginationParamsSchema.parse({ page: "3", limit: "50" })
 * // { page: 3, limit: 50 }
 */
export const paginationParamsSchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "A página deve ser um número." })
    .int("A página deve ser um número inteiro.")
    .positive("A página deve ser maior que zero.")
    .default(DEFAULT_PAGE),

  limit: z.coerce
    .number({ invalid_type_error: "O limite deve ser um número." })
    .int("O limite deve ser um número inteiro.")
    .min(1, "O limite deve ser ao menos 1.")
    .max(100, "O limite não pode exceder 100.")
    .default(DEFAULT_LIMIT),
});

/** Inferred TypeScript type for {@link paginationParamsSchema}. */
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
