import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { createHttpClient } from "../http-client";

/**
 * Runs every registered request interceptor over a bare config, the same way
 * Axios does before a request leaves.
 *
 * @param client Axios instance under test.
 * @param headers Headers the caller set on the request itself.
 * @returns The config as it would go on the wire.
 */
const runRequestInterceptors = async (
  client: ReturnType<typeof createHttpClient>,
  headers: Record<string, string> = {},
): Promise<InternalAxiosRequestConfig> => {
  let config = {
    headers: { ...headers },
    method: "post",
    url: "/subscriptions/checkout",
  } as unknown as InternalAxiosRequestConfig;

  const handlers = (
    client.interceptors.request as unknown as {
      handlers: { fulfilled?: (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }[];
    }
  ).handlers;

  for (const handler of handlers) {
    if (handler.fulfilled) {
      config = await handler.fulfilled(config);
    }
  }

  return config;
};

describe("auth request interceptor", () => {
  it("injects the session token when the caller did not set one", async () => {
    const client = createHttpClient("https://api.example", () => "session-token");

    const config = await runRequestInterceptors(client);

    expect(config.headers.Authorization).toBe("Bearer session-token");
  });

  it("leaves the request untouched when there is no session", async () => {
    const client = createHttpClient("https://api.example", () => null);

    const config = await runRequestInterceptors(client);

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("keeps the caller's own token instead of the restored session's (#1202)", async () => {
    // The public checkout signs a brand-new account in and pays with that
    // token, while the browser may still hold a session for someone else.
    // Overwriting it here charged the wrong account in production.
    const client = createHttpClient("https://api.example", () => "other-users-token");

    const config = await runRequestInterceptors(client, {
      Authorization: "Bearer just-registered-token",
    });

    expect(config.headers.Authorization).toBe("Bearer just-registered-token");
  });
});
