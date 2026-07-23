import type { AxiosInstance } from "axios";

import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { createHttpClient } from "~/core/http/http-client";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";
const DEFAULT_API_V2_BASE = "http://localhost:8001";

let cachedAdminClient: AxiosInstance | null = null;

/**
 * Returns the dedicated FastAPI admin client. Authentication always uses the
 * current in-memory bearer token; a 401 refreshes through v1's httpOnly-cookie
 * endpoint so sessions originating in the legacy API keep working.
 *
 * @returns Configured FastAPI admin HTTP client.
 */
export const useAdminHttp = (): AxiosInstance => {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const config = useRuntimeConfig();
  const session = useSessionStore();
  const apiBase = String(config.public.apiBase ?? DEFAULT_API_BASE);
  const apiV2Base = String(config.public.apiV2Base ?? DEFAULT_API_V2_BASE);
  const client = createHttpClient(apiV2Base, () => session.getAccessToken(), {
    onUnauthorized: () => refreshAccessToken(apiBase, session),
  });

  if (import.meta.client) {
    cachedAdminClient = client;
  }
  return client;
};

/** Clears the memoized admin client between unit tests. */
export const __resetAdminHttpForTests = (): void => {
  cachedAdminClient = null;
};
