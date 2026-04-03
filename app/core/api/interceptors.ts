/**
 * Global HTTP response interceptors for the Auraxis Axios client.
 *
 * Registers side-effect handlers for HTTP 401, 403 and 5xx responses so that
 * individual feature modules do not need to repeat toast or refresh logic for
 * these cross-cutting concerns.
 *
 * 401 handling is opt-in: when `options.onUnauthorized` is provided the
 * interceptor attempts a token refresh and retries the original request.
 * When absent, 401 is re-thrown as-is so auth-endpoint flows (e.g. wrong
 * credentials on login) are not affected.
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { ApiError } from "~/core/errors";

import type { ResponseInterceptorOptions } from "./types";

/** User-facing message shown when a 403 Forbidden response is received. */
const FORBIDDEN_MESSAGE =
  "Você não tem permissão para acessar este recurso.";

/** User-facing message shown when a 5xx server error is received. */
const SERVER_ERROR_MESSAGE =
  "Ocorreu um erro no servidor. Tente novamente em instantes.";

/**
 * Extends the Axios request config with an internal retry flag so the
 * interceptor can prevent infinite refresh loops.
 */
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Converts an unknown thrown value to a typed {@link ApiError}.
 *
 * Handles three cases:
 * 1. Already an ApiError — returned as-is.
 * 2. An Axios error — status, message and code extracted from the response.
 * 3. Any other value — wrapped in a generic 500 ApiError.
 *
 * @param error Unknown thrown value from an Axios request.
 * @returns Typed ApiError.
 */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const responseData = error.response?.data as
      | { message?: string; code?: string }
      | undefined;
    const message =
      responseData?.message ?? error.message ?? "Unexpected error";
    const code = responseData?.code;

    return new ApiError(status, message, code);
  }

  const message =
    error instanceof Error ? error.message : "Unexpected error";

  return new ApiError(500, message);
};

/**
 * Registers a response interceptor on the provided Axios instance.
 *
 * Behaviour by HTTP status:
 * - **401**: When `options.onUnauthorized` is provided, calls it to refresh
 *   tokens and retries the original request once. If the refresh fails or no
 *   handler is configured, re-throws the 401 as an {@link ApiError}.
 * - **403**: Calls `options.onForbidden` with the localised message, then re-throws.
 * - **5xx**: Calls `options.onServerError` with the localised message, then re-throws.
 * - **All errors**: Normalised to {@link ApiError} before re-throwing.
 *
 * The interceptor is purely additive — it never swallows errors. Feature-level
 * `catch` blocks still receive the normalised {@link ApiError}.
 *
 * @param client Axios instance to attach the interceptor to.
 * @param options Optional side-effect callbacks for 401, 403 and 5xx responses.
 */
export const registerResponseInterceptors = (
  client: AxiosInstance,
  options: ResponseInterceptorOptions,
): void => {
  client.interceptors.response.use(
    (response) => response,
    async (error: unknown): Promise<never> => {
      const apiError = toApiError(error);

      if (apiError.status === 401 && options.onUnauthorized) {
        const config = axios.isAxiosError(error)
          ? (error.config as RetryableConfig | undefined)
          : undefined;

        if (config && !config._retry) {
          config._retry = true;
          const newToken = await options.onUnauthorized();

          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
            return client(config) as Promise<never>;
          }
        }
      }

      if (apiError.status === 403) {
        options.onForbidden?.(FORBIDDEN_MESSAGE);
        return Promise.reject(apiError);
      }

      if (apiError.status >= 500) {
        options.onServerError?.(SERVER_ERROR_MESSAGE);
        return Promise.reject(apiError);
      }

      return Promise.reject(apiError);
    },
  );
};
