/**
 * Internal HTTP client utilities with ofetch integration.
 *
 * Provides low-level HTTP methods and dependency injection for testing.
 * Usually accessed via useHttp composable which wraps this functionality.
 */
export { createHttpClientMethods, type HttpClientMethods, type HttpClientDeps } from "./useHttpClient";
export { normalizeHttpClientBaseUrl } from "./useHttpClient";
