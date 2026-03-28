import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { registerResponseInterceptors } from "~/core/api/interceptors";
import type { ResponseInterceptorOptions } from "~/core/api/types";

/**
 * Removes trailing slashes from a base URL to avoid duplicated separators.
 *
 * @param rawUrl Candidate base URL.
 * @returns Normalized base URL.
 */
export const normalizeBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

/**
 * Creates an authorization interceptor that injects a bearer token when available.
 *
 * @param getAccessToken Lazy token resolver.
 * @returns Axios request interceptor.
 */
const createAuthInterceptor = (
  getAccessToken: () => string | null,
): ((config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) => {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };
};

/**
 * Creates the canonical Auraxis HTTP client with auth interception, v2 contract
 * header, and optional global response interceptors for 403/5xx side effects.
 *
 * When `interceptorOptions` is provided, 403 and 5xx responses automatically
 * invoke the corresponding callbacks (typically to show toast notifications)
 * before re-throwing the normalised {@link ApiError}. Feature-level `catch`
 * blocks still receive the error unchanged.
 *
 * 401 is intentionally excluded from global handling to avoid conflicting with
 * auth-endpoint flows (e.g., wrong credentials returning 401 on `/auth/login`).
 *
 * @param baseUrl API base URL (trailing slashes are removed automatically).
 * @param getAccessToken Lazy token resolver injected into every request header.
 * @param interceptorOptions Optional callbacks for cross-cutting response handling.
 * @returns Configured Axios instance.
 */
export const createHttpClient = (
  baseUrl: string,
  getAccessToken: () => string | null,
  interceptorOptions?: ResponseInterceptorOptions,
): AxiosInstance => {
  const client = axios.create({
    baseURL: normalizeBaseUrl(baseUrl),
    timeout: 15_000,
    headers: { "X-API-Contract": "v2" },
  });

  client.interceptors.request.use(createAuthInterceptor(getAccessToken));

  if (interceptorOptions !== undefined) {
    registerResponseInterceptors(client, interceptorOptions);
  }

  return client;
};
