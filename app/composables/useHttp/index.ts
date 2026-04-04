/**
 * Composable for accessing the application's HTTP client instance.
 *
 * Resolves runtime configuration and instantiates the HTTP client with
 * session token interceptor.
 */
/* v8 ignore start */
export { useHttp } from "./useHttp";
export { createHttpClient, normalizeBaseUrl } from "~/core/http/http-client";
/* v8 ignore stop */
