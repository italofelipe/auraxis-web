/**
 * Public API for `app/core/api/`.
 *
 * Re-exports:
 * - Type contracts: {@link ApiResponse}, {@link PaginatedResponse}, {@link PaginationMeta}, {@link ResponseInterceptorOptions}
 * - Runtime factory: {@link registerResponseInterceptors}
 * - Utility: {@link toApiError}
 */
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  ResponseInterceptorOptions,
} from "./types";

export { registerResponseInterceptors, toApiError } from "./interceptors";
