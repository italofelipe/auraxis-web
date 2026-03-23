/**
 * Composable for accessing the application's HTTP client instance.
 *
 * Resolves runtime configuration and instantiates the HTTP client with
 * session token interceptor.
 */
export { useHttp } from "./useHttp";
export { createHttpClient, normalizeBaseUrl } from "~/core/http/http-client";
