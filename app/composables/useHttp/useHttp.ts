import axios, { type AxiosInstance, type RawAxiosRequestHeaders } from "axios";
import { useDialog, useMessage } from "naive-ui";

import { createHttpClient } from "~/core/http/http-client";
import { isAdminImpersonationReadOnlyActive } from "~/features/admin/impersonation/composables/use-admin-impersonation-session";
import { useEmailVerificationGate } from "~/features/auth/composables/use-email-verification-gate";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

/**
 * Name of the non-HttpOnly CSRF cookie set by the backend when
 * `JWT_COOKIE_CSRF_PROTECT` is enabled (SEC-AUD-03). The cookie holds the
 * double-submit token that the client mirrors back on refresh requests as
 * the `X-CSRF-TOKEN` header. Must stay in sync with
 * `JWT_REFRESH_CSRF_COOKIE_NAME` in `repos/auraxis-api/config/__init__.py`.
 */
export const CSRF_REFRESH_COOKIE_NAME = "auraxis_csrf_refresh";

/**
 * Header name expected by the backend for CSRF double-submit validation.
 * Must stay in sync with `JWT_REFRESH_CSRF_HEADER_NAME` in the API config.
 */
export const CSRF_HEADER_NAME = "X-CSRF-TOKEN";

export {
  createHttpClient,
  normalizeBaseUrl,
} from "~/core/http/http-client";

/** Shape of the data payload returned by POST /auth/refresh (v2 envelope). */
interface RefreshResponseData {
  readonly token: string;
  readonly user?: {
    readonly email: string;
    readonly email_confirmed?: boolean;
    readonly email_confirmation_deadline_at?: string | null;
    readonly email_confirmation_blocked?: boolean;
  };
}

/** Full v2 envelope for the token-refresh endpoint. */
interface RefreshEnvelope {
  readonly success: boolean;
  readonly data: RefreshResponseData;
}

/**
 * Reads a cookie value from `document.cookie` by exact name match.
 *
 * Returns null on the server (no document) and when the cookie is absent
 * or empty. The match is exact — no decoding heuristics, no partial-prefix
 * matches — because both sides own the cookie name and we don't want a
 * subtly malformed cookie to be mistaken for a valid token.
 *
 * @param name Cookie name (case-sensitive).
 * @returns Cookie value, or null when not available.
 */
export const readCookieValue = (name: string): string | null => {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }
  const target = `${name}=`;
  const pairs = document.cookie.split(";");
  for (const raw of pairs) {
    const pair = raw.trimStart();
    if (pair.startsWith(target)) {
      const value = pair.slice(target.length);
      return value === "" ? null : value;
    }
  }
  return null;
};

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 *
 * SEC-GAP-01: The refresh token is no longer passed via Authorization header.
 * The browser sends the `auraxis_refresh` httpOnly cookie automatically when
 * `withCredentials: true` is set.
 *
 * SEC-AUD-03: When the backend sets the `auraxis_csrf_refresh` companion
 * cookie (active only when `AURAXIS_CSRF_ENFORCE=true` is flipped server-side),
 * we mirror its value into the `X-CSRF-TOKEN` request header so the backend's
 * double-submit check passes. We send the header proactively whenever the
 * cookie is present — backend silently ignores it while the flag is OFF,
 * validates it when ON. Same canary pattern as SEC-AUD-07 cookie-only flip.
 *
 * On success the access token is updated in the session store. On failure the
 * user is signed out.
 *
 * @param apiBase Absolute base URL of the Auraxis API.
 * @param sessionStore Active session Pinia store instance.
 * @returns New access token, or null if the refresh failed.
 */
export const refreshAccessToken = async (
  apiBase: string,
  sessionStore: ReturnType<typeof useSessionStore>,
): Promise<string | null> => {
  const headers: RawAxiosRequestHeaders = { "X-API-Contract": "v2" };
  const csrfToken = readCookieValue(CSRF_REFRESH_COOKIE_NAME);
  if (csrfToken) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }

  try {
    const response = await axios.post<RefreshEnvelope>(
      `${apiBase}/auth/refresh`,
      {},
      {
        withCredentials: true, // sends the httpOnly auraxis_refresh cookie
        headers,
      },
    );
    const { token, user } = response.data.data;
    if (user) {
      sessionStore.signIn({
        accessToken: token,
        userEmail: user.email,
        emailConfirmed: user.email_confirmed,
        emailConfirmationDeadlineAt: user.email_confirmation_deadline_at ?? null,
        emailConfirmationBlocked: user.email_confirmation_blocked ?? false,
      });
    } else {
      sessionStore.updateTokens(token);
    }
    return token;
  } catch {
    sessionStore.signOut();
    return null;
  }
};

/**
 * Module-level cache holding the single shared Axios instance.
 *
 * `useHttp()` is invoked from 37+ feature `*.client.ts` factories. Without
 * memoization each call built a brand-new Axios instance, and each instance
 * carried its own `createSharedRefresh` single-flight closure — so the 401
 * stampede guard only deduped concurrent refreshes WITHIN one instance, never
 * across callers. On token expiry the dashboard's parallel feature queries
 * each fired their own `POST /auth/refresh`, tripping the backend
 * `token_refresh` rate limit (#976).
 *
 * Caching the client makes every client-side caller share ONE instance and
 * therefore ONE global single-flight refresh. `getAccessToken` stays a lazy
 * callback so the cached client always reads the live token from the session
 * store.
 *
 * SSR safety: the cache is populated and reused ONLY on the client
 * (`import.meta.client`). `useHttp()` is also reachable server-side from
 * `middleware/authenticated.ts` and `plugins/session.ts`; on the server we
 * build a throwaway per-call client and never write it here. Otherwise the
 * first (possibly server-side) call would freeze client-only naive-ui context
 * (`useMessage`/`useDialog`) into the singleton for the whole client session.
 */
let cachedClient: AxiosInstance | null = null;

/**
 * Guards the session-expiry dialog against stacking (#977).
 *
 * When the refresh token is also expired, `onUnauthorized` opens a blocking
 * "session expired" dialog. Concurrent 401s — even though #976's single-flight
 * collapses the refresh itself — can still fan out into multiple
 * `onUnauthorized` rejections, each trying to open its own dialog. This boolean
 * ensures only the first one opens; the flag resets when the user acknowledges
 * (or the dialog otherwise closes) so a later, genuinely new session loss can
 * surface again.
 */
let isSessionDialogOpen = false;

/**
 * Resets the memoized HTTP client. Test-only — production code never needs to
 * drop the singleton. Exported so specs can isolate the module-level cache
 * between cases.
 */
export const __resetHttpClientForTests = (): void => {
  cachedClient = null;
  isSessionDialogOpen = false;
};

/**
 * Resolves runtime config and instantiates the application HTTP client.
 *
 * Registers global response interceptors that automatically handle:
 * - **401 Unauthorized** → attempts a token refresh via `POST /auth/refresh`
 *   and retries the original request. Signs the user out if the refresh fails.
 * - **403 Forbidden** → shows a "no permission" error toast.
 * - **5xx Server Error** → shows a generic "server error" toast.
 *
 * On the client the instance is memoized at module scope, so all 37+ feature
 * factories share ONE instance and ONE global single-flight refresh (#976).
 * On the server (SSR middleware/plugins) a throwaway per-call client is built
 * and NOT cached — see {@link cachedClient}.
 *
 * The cold-start path must run inside a client setup context: it calls
 * `useRuntimeConfig()`, `useMessage()`, `useDialog()` and `useI18n()`, which
 * are only available there.
 *
 * @returns {AxiosInstance} Configured Axios instance with auth and response interceptors.
 */
export const useHttp = (): AxiosInstance => {
  // Cache-hit guard — the whole point of #976. Must stay OUTSIDE the v8-ignore
  // range so coverage proves it runs and would fail if it were ever removed.
  if (cachedClient) {
    return cachedClient;
  }

  /* v8 ignore start */
  const runtimeConfig = useRuntimeConfig();
  const sessionStore = useSessionStore();
  const verificationGate = useEmailVerificationGate();
  const message = useMessage();
  const dialog = useDialog();
  const { t } = useI18n();

  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);

  const client = createHttpClient(
    apiBase,
    () => sessionStore.getAccessToken(),
    {
      onUnauthorized: async (): Promise<string | null> => {
        const newToken = await refreshAccessToken(apiBase, sessionStore);

        if (!newToken && !isSessionDialogOpen) {
          // Both the access token and the refresh token are expired.
          // Show a non-dismissable modal so the user acknowledges the
          // session loss before being sent to the login page. The
          // `isSessionDialogOpen` guard keeps concurrent 401s from stacking
          // multiple identical dialogs (#977); it resets once acknowledged so
          // a future, genuinely new session loss can surface again.
          isSessionDialogOpen = true;
          dialog.warning({
            title: t("auth.sessionExpired.title"),
            content: t("auth.sessionExpired.message"),
            positiveText: t("auth.sessionExpired.action"),
            closable: false,
            closeOnEsc: false,
            maskClosable: false,
            onPositiveClick: () => {
              isSessionDialogOpen = false;
              return navigateTo("/login");
            },
            onClose: () => {
              isSessionDialogOpen = false;
            },
          });
        }

        return newToken;
      },
      onEmailVerificationRequired: (body): void => {
        // Mirror the soft-block state into the session store so any banner
        // re-renders into "expired" mode without waiting for /user/me to refetch.
        sessionStore.emailVerificationRequiredNow = true;
        sessionStore.emailVerified = false;
        verificationGate.open({
          message: body.message,
          deadlinePassedAt: body.deadline_passed_at,
          resendEndpoint: body.resend_endpoint,
        });
      },
      onForbidden: (msg: string): void => {
        message.error(msg, { duration: 5_000 });
      },
      onServerError: (msg: string): void => {
        message.error(msg, { duration: 5_000 });
      },
    },
  );

  client.interceptors.request.use((config) => {
    const method = config.method?.toLowerCase() ?? "get";
    const mutatingMethods = new Set(["post", "put", "patch", "delete"]);
    const requestPath = String(config.url ?? "");

    if (
      import.meta.client &&
      mutatingMethods.has(method) &&
      isAdminImpersonationReadOnlyActive() &&
      !requestPath.startsWith("/admin/impersonation")
    ) {
      return Promise.reject(new Error("Modo de impersonação somente leitura bloqueou esta mutação."));
    }

    return config;
  });
  /* v8 ignore stop */

  // Only memoize on the client. On the server we return a per-call instance so
  // the singleton never captures server-context (SSR-safe — see cachedClient).
  if (import.meta.client) {
    cachedClient = client;
  }

  return client;
};
