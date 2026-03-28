import type { AxiosInstance } from "axios";
import { useMessage } from "naive-ui";

import { createHttpClient } from "~/core/http/http-client";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export {
  createHttpClient,
  normalizeBaseUrl,
} from "~/core/http/http-client";

/**
 * Resolves runtime config and instantiates the application HTTP client.
 *
 * Registers global response interceptors that automatically handle:
 * - **403 Forbidden** → shows a "no permission" error toast.
 * - **5xx Server Error** → shows a generic "server error" toast.
 *
 * 401 is not intercepted globally to avoid conflicting with auth-endpoint
 * error handling (e.g., wrong credentials on `/auth/login`).
 *
 * Must be called from within a Vue component `setup` context so that
 * `useMessage()` and `useRuntimeConfig()` are available.
 *
 * @returns Configured Axios instance with auth and response interceptors.
 */
export const useHttp = (): AxiosInstance => {
  const runtimeConfig = useRuntimeConfig();
  const sessionStore = useSessionStore();
  const message = useMessage();

  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);

  return createHttpClient(
    apiBase,
    () => sessionStore.getAccessToken(),
    {
      onForbidden: (msg: string): void => {
        message.error(msg, { duration: 5_000 });
      },
      onServerError: (msg: string): void => {
        message.error(msg, { duration: 5_000 });
      },
    },
  );
};
