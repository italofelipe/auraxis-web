import type { AxiosInstance } from "axios";

import { createHttpClient } from "~/core/http/http-client";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export {
  createHttpClient,
  normalizeBaseUrl,
} from "~/core/http/http-client";

/**
 * Resolves runtime config and instantiates the application HTTP client.
 * @returns HTTP client with session interceptor.
 */
export const useHttp = (): AxiosInstance => {
  const runtimeConfig = useRuntimeConfig();
  const sessionStore = useSessionStore();
  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);

  return createHttpClient(apiBase, () => sessionStore.getAccessToken());
};
