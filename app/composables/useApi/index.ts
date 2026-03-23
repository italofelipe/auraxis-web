/**
 * Minimal HTTP client for health checks and base URL resolution.
 *
 * Used for basic API availability checks before main request handling.
 */
export { useApi, createApiClient, removeTrailingSlashes } from "./useApi";
export type { WebApiClient, HealthResponse } from "./useApi";
