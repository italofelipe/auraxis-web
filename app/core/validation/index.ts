/**
 * Public API for `app/core/validation/`.
 *
 * Re-exports:
 * - Common field schemas: {@link cpfSchema}, {@link cnpjSchema},
 *   {@link phoneSchema}, {@link currencySchema}, {@link dateSchema}
 * - Pagination schema: {@link paginationParamsSchema}
 * - Inferred TypeScript types for each schema
 */
export {
  cnpjSchema,
  cpfSchema,
  currencySchema,
  dateSchema,
  phoneSchema,
} from "./schemas/common";
export type {
  CnpjSchema,
  CpfSchema,
  CurrencySchema,
  DateSchema,
  PhoneSchema,
} from "./schemas/common";

export { paginationParamsSchema } from "./schemas/pagination";
export type { PaginationParams } from "./schemas/pagination";
