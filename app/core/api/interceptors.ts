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

import type {
  EmailVerificationRequiredBody,
  ResponseInterceptorOptions,
} from "./types";

/**
 * Type guard: true when the body looks like a backend
 * `EMAIL_VERIFICATION_REQUIRED` response.
 *
 * See `auraxis-api/app/decorators/require_email_verified.py` for the
 * canonical shape.
 *
 * @param body Raw response body to inspect.
 * @returns True when the body has `error === "EMAIL_VERIFICATION_REQUIRED"`.
 */
const isEmailVerificationRequiredBody = (
  body: unknown,
): body is EmailVerificationRequiredBody => {
  if (body === null || typeof body !== "object") {
    return false;
  }
  const candidate = body as { error?: unknown };
  return candidate.error === "EMAIL_VERIFICATION_REQUIRED";
};

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
 * Deduplicates concurrent refresh calls triggered by parallel 401 responses.
 *
 * When N requests fail with 401 before any refresh has completed, the first
 * one kicks off `onUnauthorized()` and the others await the same in-flight
 * promise. Once the promise settles, the cache is cleared so subsequent
 * 401s can trigger a fresh refresh.
 *
 * @param onUnauthorized Underlying refresh handler.
 * @returns A wrapped handler that collapses concurrent calls into one.
 */
const createSharedRefresh = (
  onUnauthorized: () => Promise<string | null>,
): (() => Promise<string | null>) => {
  let inflight: Promise<string | null> | null = null;
  return (): Promise<string | null> => {
    if (inflight) {
      return inflight;
    }
    inflight = onUnauthorized().finally(() => {
      inflight = null;
    });
    return inflight;
  };
};

/**
 * Registers a response interceptor on the provided Axios instance.
 *
 * Behaviour by HTTP status:
 * - **401**: When `options.onUnauthorized` is provided, calls it to refresh
 *   tokens and retries the original request once. Concurrent 401s share a
 *   single in-flight refresh (stampede guard). If the refresh fails or no
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
/**
 * Attempts to recover from a 401 by refreshing the access token and retrying
 * the original request. Returns the resolved client promise when the retry
 * succeeds, or null when no refresh handler is available / refresh failed.
 *
 * @param client Axios instance bound to the interceptor.
 * @param error Original Axios error that triggered the interceptor.
 * @param sharedRefresh Refresh handler shared across concurrent 401s.
 * @returns Retried response, or null when no retry was performed.
 */
const tryRefreshAndRetry = async (
  client: AxiosInstance,
  error: unknown,
  sharedRefresh: () => Promise<string | null>,
): Promise<unknown> => {
  const config = axios.isAxiosError(error)
    ? (error.config as RetryableConfig | undefined)
    : undefined;
  if (!config || config._retry) {
    return null;
  }
  config._retry = true;
  const newToken = await sharedRefresh();
  if (!newToken) {
    return null;
  }
  config.headers.Authorization = `Bearer ${newToken}`;
  return client(config);
};

/**
 * Routes a 403 response either to the email-verification gate handler (when
 * the body matches `EMAIL_VERIFICATION_REQUIRED`) or to the generic
 * `onForbidden` toast handler.
 *
 * @param error Original Axios error from the failed request.
 * @param options Interceptor callbacks.
 */
const handleForbidden = (
  error: unknown,
  options: ResponseInterceptorOptions,
): void => {
  const rawBody = axios.isAxiosError(error)
    ? error.response?.data
    : undefined;
  if (
    options.onEmailVerificationRequired
    && isEmailVerificationRequiredBody(rawBody)
  ) {
    options.onEmailVerificationRequired(rawBody);
    return;
  }
  options.onForbidden?.(FORBIDDEN_MESSAGE);
};

/**
 * Public entry point — wires the cross-cutting response handlers (401 refresh,
 * 403 email-verification gate / forbidden toast, 5xx server-error toast)
 * onto the provided Axios instance. See the block doc above
 * {@link tryRefreshAndRetry} for the per-status behaviour matrix.
 *
 * @param client Axios instance to attach the interceptor to.
 * @param options Optional side-effect callbacks for 401, 403 and 5xx responses.
 */
export const registerResponseInterceptors = (
  client: AxiosInstance,
  options: ResponseInterceptorOptions,
): void => {
  const sharedRefresh = options.onUnauthorized
    ? createSharedRefresh(options.onUnauthorized)
    : null;

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown): Promise<never> => {
      const apiError = toApiError(error);

      if (apiError.status === 401 && sharedRefresh) {
        const retried = await tryRefreshAndRetry(client, error, sharedRefresh);
        if (retried !== null) {
          return retried as Promise<never>;
        }
      }

      if (apiError.status === 403) {
        handleForbidden(error, options);
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
