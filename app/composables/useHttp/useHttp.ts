import axios, { type AxiosInstance } from "axios";
import { useMessage } from "naive-ui";

import { createHttpClient } from "~/core/http/http-client";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export {
  createHttpClient,
  normalizeBaseUrl,
} from "~/core/http/http-client";

/** Shape of the data payload returned by POST /auth/refresh (v2 envelope). */
interface RefreshResponseData {
  readonly token: string;
  readonly refresh_token: string;
}

/** Full v2 envelope for the token-refresh endpoint. */
interface RefreshEnvelope {
  readonly success: boolean;
  readonly data: RefreshResponseData;
}

/**
 * Exchanges the stored refresh token for a new access+refresh token pair.
 * On success, persists both tokens to the session store and returns the new
 * access token. On failure, signs the user out and returns null.
 *
 * @param apiBase Absolute base URL of the Auraxis API.
 * @param sessionStore Active session Pinia store instance.
 * @returns New access token, or null if the refresh failed.
 */
export const refreshAccessToken = async (
  apiBase: string,
  sessionStore: ReturnType<typeof useSessionStore>,
): Promise<string | null> => {
  const refreshToken = sessionStore.getRefreshToken();

  if (!refreshToken) {
    sessionStore.signOut();
    return null;
  }

  try {
    const response = await axios.post<RefreshEnvelope>(
      `${apiBase}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "X-API-Contract": "v2",
        },
      },
    );
    const { token, refresh_token } = response.data.data;
    sessionStore.updateTokens(token, refresh_token);
    return token;
  } catch {
    sessionStore.signOut();
    return null;
  }
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
 * Must be called from within a Vue component `setup` context so that
 * `useMessage()` and `useRuntimeConfig()` are available.
 *
 * @returns Configured Axios instance with auth and response interceptors.
 */
/* v8 ignore start */
/** @returns {AxiosInstance} Configured Axios instance with auth and response interceptors. */
export const useHttp = (): AxiosInstance => {
  const runtimeConfig = useRuntimeConfig();
  const sessionStore = useSessionStore();
  const message = useMessage();

  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);

  return createHttpClient(
    apiBase,
    () => sessionStore.getAccessToken(),
    {
      onUnauthorized: async (): Promise<string | null> => {
        const newToken = await refreshAccessToken(apiBase, sessionStore);
        if (!newToken) {
          // Both the access token and the refresh token are expired — the
          // session is fully invalid. Sign the user out and send them home.
          await navigateTo("/");
        }
        return newToken;
      },
      onForbidden: (msg: string): void => {
        message.error(msg, { duration: 5_000 });
      },
      onServerError: (msg: string): void => {
        message.error(msg, { duration: 5_000 });
      },
    },
  );
};
/* v8 ignore stop */
