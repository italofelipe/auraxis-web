import axios, { type AxiosRequestConfig } from "axios";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CSRF_HEADER_NAME,
  CSRF_REFRESH_COOKIE_NAME,
  createHttpClient,
  normalizeBaseUrl,
  readCookieValue,
  refreshAccessToken,
  useHttp,
  __resetHttpClientForTests,
} from "./useHttp";

const useSessionStoreMock = vi.hoisted(() => vi.fn());
const sessionStoreStub = vi.hoisted(() => ({
  getAccessToken: vi.fn(() => "live-token"),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateTokens: vi.fn(),
  emailVerificationRequiredNow: false,
  emailVerified: true,
}));

const messageStub = vi.hoisted(() => ({ error: vi.fn() }));
const dialogStub = vi.hoisted(() => ({ warning: vi.fn() }));
const verificationGateStub = vi.hoisted(() => ({ open: vi.fn() }));
const navigateToMock = vi.hoisted(() => vi.fn());

vi.mock("~/stores/session", () => ({
  useSessionStore: useSessionStoreMock,
}));

vi.mock("naive-ui", (): Record<string, unknown> => ({
  useMessage: (): typeof messageStub => messageStub,
  useDialog: (): typeof dialogStub => dialogStub,
}));

vi.mock("~/features/auth/composables/use-email-verification-gate", (): Record<string, unknown> => ({
  useEmailVerificationGate: (): typeof verificationGateStub => verificationGateStub,
}));

vi.mock("~/features/admin/impersonation/composables/use-admin-impersonation-session", (): Record<string, unknown> => ({
  isAdminImpersonationReadOnlyActive: (): boolean => false,
}));

mockNuxtImport("useRuntimeConfig", () => (): { public: { apiBase: string } } => ({
  public: { apiBase: "http://localhost:5000" },
}));
mockNuxtImport("useI18n", () => (): { t: (key: string) => string } => ({
  t: (key: string): string => key,
}));
mockNuxtImport("navigateTo", () => navigateToMock);

describe("useHttp helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("remove barras finais da base URL", () => {
    expect(normalizeBaseUrl("http://localhost:5000///")).toBe("http://localhost:5000");
    expect(normalizeBaseUrl("http://localhost:5000")).toBe("http://localhost:5000");
    expect(normalizeBaseUrl("")).toBe("");
  });

  it("configura cliente axios com base normalizada", () => {
    const client = createHttpClient("http://localhost:5000///", () => null);

    expect(client.defaults.baseURL).toBe("http://localhost:5000");
    expect(client.defaults.timeout).toBe(15000);
  });

  it("habilita withCredentials para enviar o cookie httpOnly de refresh (SEC-GAP-01)", () => {
    const client = createHttpClient("http://localhost:5000", () => null);

    expect(client.defaults.withCredentials).toBe(true);
  });

  it("define header X-API-Contract: v2 por padrão", () => {
    const client = createHttpClient("http://localhost:5000", () => null);

    expect(
      (client.defaults.headers as Record<string, unknown>)["X-API-Contract"],
    ).toBe("v2");
  });

  it("injeta Authorization quando token existe", () => {
    const client = createHttpClient("http://localhost:5000", () => "token-abc");
    const handlers = (
      client.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (config: AxiosRequestConfig) => AxiosRequestConfig;
        }>;
      }
    ).handlers;

    expect(handlers[0]).toBeDefined();
    const interceptor = handlers[0]!.fulfilled;
    const config = interceptor({ headers: {} });

    expect((config.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-abc",
    );
  });

  it("nao injeta Authorization quando token e nulo", () => {
    const client = createHttpClient("http://localhost:5000", () => null);
    const handlers = (
      client.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (config: AxiosRequestConfig) => AxiosRequestConfig;
        }>;
      }
    ).handlers;

    expect(handlers[0]).toBeDefined();
    const interceptor = handlers[0]!.fulfilled;
    const config = interceptor({ headers: {} });

    expect((config.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("nao registra interceptor de resposta quando interceptorOptions é omitido", () => {
    const client = createHttpClient("http://localhost:5000", () => null);
    const responseHandlers = (
      client.interceptors.response as unknown as {
        handlers: Array<unknown>;
      }
    ).handlers;

    // captureRequestIdInterceptor (1) + axios-retry (1) = 2
    expect(responseHandlers.filter(Boolean)).toHaveLength(2);
  });

  it("registra interceptor de resposta quando interceptorOptions é fornecido", () => {
    const onForbidden = vi.fn();
    const onServerError = vi.fn();

    const client = createHttpClient(
      "http://localhost:5000",
      () => null,
      { onForbidden, onServerError },
    );

    const responseHandlers = (
      client.interceptors.response as unknown as {
        handlers: Array<unknown>;
      }
    ).handlers;

    // captureRequestIdInterceptor (1) + axios-retry (1) + registerResponseInterceptors (1) = 3
    expect(responseHandlers.filter(Boolean)).toHaveLength(3);
  });
});

describe("refreshAccessToken (SEC-GAP-01 — cookie-based)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("calls POST /auth/refresh with withCredentials: true (no Authorization header)", async () => {
    const sessionStore = {
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    let capturedConfig: Record<string, unknown> = {};
    vi.spyOn(axios, "post").mockImplementationOnce(
      (_url, _body, config) => {
        capturedConfig = config as Record<string, unknown>;
        return Promise.resolve({
          data: { success: true, data: { token: "new-token" } },
        });
      },
    );

    await refreshAccessToken("http://api", sessionStore);

    expect(capturedConfig.withCredentials).toBe(true);
    expect(capturedConfig.headers).not.toHaveProperty("Authorization");
  });

  it("calls updateTokens with the new access token and returns it", async () => {
    const sessionStore = {
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        success: true,
        data: { token: "new-access-token" },
      },
    });

    const result = await refreshAccessToken("http://api", sessionStore);

    expect(result).toBe("new-access-token");
    expect(sessionStore.updateTokens).toHaveBeenCalledWith("new-access-token");
    expect(sessionStore.signOut).not.toHaveBeenCalled();
  });

  it("signs out and returns null when refresh request fails", async () => {
    const sessionStore = {
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    vi.spyOn(axios, "post").mockRejectedValueOnce(new Error("Network error"));

    const result = await refreshAccessToken("http://api", sessionStore);

    expect(result).toBeNull();
    expect(sessionStore.signOut).toHaveBeenCalledOnce();
  });

  it("signs out and returns null when the server returns 401 (expired cookie)", async () => {
    const sessionStore = {
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    const axiosError = Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { status: 401 },
    });
    vi.spyOn(axios, "post").mockRejectedValueOnce(axiosError);

    const result = await refreshAccessToken("http://api", sessionStore);

    expect(result).toBeNull();
    expect(sessionStore.signOut).toHaveBeenCalledOnce();
  });
});

describe("CSRF double-submit (SEC-AUD-03)", () => {
  /**
   * Stub `document.cookie` per test instead of mutating the shared
   * happy-dom store — happy-dom doesn't honor `expires` for inline clears,
   * so cookies leak between tests. Each test that needs a specific cookie
   * state declares it via `withCookies(...)` and calls the returned
   * restore function in a finally block.
   *
   * @param value Raw cookie string the override should return (`""` for none).
   * @returns Restore function that resets `document.cookie` to the previous descriptor.
   */
  const withCookies = (value: string): (() => void) => {
    const original = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => value,
      set: () => undefined,
    });
    return () => {
      if (original) {
        Object.defineProperty(document, "cookie", original);
      } else {
        // @ts-expect-error — restore by removing override
        delete document.cookie;
      }
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("readCookieValue", () => {
    it("returns null when document is undefined (SSR)", () => {
      const originalDocument = globalThis.document;
      // @ts-expect-error — intentionally remove for SSR simulation
      delete globalThis.document;
      try {
        expect(readCookieValue("anything")).toBeNull();
      } finally {
        globalThis.document = originalDocument;
      }
    });

    it("returns null when the cookie is absent", () => {
      const restore = withCookies("");
      try {
        expect(readCookieValue("does_not_exist")).toBeNull();
      } finally {
        restore();
      }
    });

    it("returns the value when the cookie is present", () => {
      const restore = withCookies("auraxis_csrf_refresh=abc-123-XYZ");
      try {
        expect(readCookieValue(CSRF_REFRESH_COOKIE_NAME)).toBe("abc-123-XYZ");
      } finally {
        restore();
      }
    });

    it("matches exact name (does not return partial prefix matches)", () => {
      const restore = withCookies("auraxis_csrf_refresh_other=wrong");
      try {
        expect(readCookieValue(CSRF_REFRESH_COOKIE_NAME)).toBeNull();
      } finally {
        restore();
      }
    });

    it("returns null on empty value (refuses to send a malformed token)", () => {
      const restore = withCookies("auraxis_csrf_refresh=");
      try {
        expect(readCookieValue(CSRF_REFRESH_COOKIE_NAME)).toBeNull();
      } finally {
        restore();
      }
    });

    it("handles whitespace between cookies", () => {
      const restore = withCookies("first=alpha; auraxis_csrf_refresh=token-beta");
      try {
        expect(readCookieValue(CSRF_REFRESH_COOKIE_NAME)).toBe("token-beta");
      } finally {
        restore();
      }
    });
  });

  describe("refreshAccessToken X-CSRF-TOKEN header", () => {
    it("includes X-CSRF-TOKEN header when CSRF cookie is present", async () => {
      const restore = withCookies("auraxis_csrf_refresh=csrf-token-value");
      try {
        const sessionStore = {
          signOut: vi.fn(),
          updateTokens: vi.fn(),
        } as unknown as Parameters<typeof refreshAccessToken>[1];

        let capturedHeaders: Record<string, unknown> = {};
        vi.spyOn(axios, "post").mockImplementationOnce(
          (_url, _body, config) => {
            capturedHeaders = (config as { headers?: Record<string, unknown> }).headers ?? {};
            return Promise.resolve({
              data: { success: true, data: { token: "new-token" } },
            });
          },
        );

        await refreshAccessToken("http://api", sessionStore);

        expect(capturedHeaders[CSRF_HEADER_NAME]).toBe("csrf-token-value");
        expect(capturedHeaders["X-API-Contract"]).toBe("v2");
      } finally {
        restore();
      }
    });

    it("omits X-CSRF-TOKEN header when CSRF cookie is absent (backend with AURAXIS_CSRF_ENFORCE=false)", async () => {
      const restore = withCookies("");
      try {
        const sessionStore = {
          signOut: vi.fn(),
          updateTokens: vi.fn(),
        } as unknown as Parameters<typeof refreshAccessToken>[1];

        let capturedHeaders: Record<string, unknown> = {};
        vi.spyOn(axios, "post").mockImplementationOnce(
          (_url, _body, config) => {
            capturedHeaders = (config as { headers?: Record<string, unknown> }).headers ?? {};
            return Promise.resolve({
              data: { success: true, data: { token: "new-token" } },
            });
          },
        );

        await refreshAccessToken("http://api", sessionStore);

        expect(capturedHeaders).not.toHaveProperty(CSRF_HEADER_NAME);
        expect(capturedHeaders["X-API-Contract"]).toBe("v2");
      } finally {
        restore();
      }
    });
  });
});

describe("useHttp singleton (#976)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetHttpClientForTests();
    sessionStoreStub.getAccessToken.mockReturnValue("live-token");
    useSessionStoreMock.mockReturnValue(sessionStoreStub);
  });

  afterEach(() => {
    __resetHttpClientForTests();
  });

  it("returns the SAME Axios instance across calls (shared singleton)", () => {
    const first = useHttp();
    const second = useHttp();

    expect(first).toBe(second);
  });

  it("the cached client always reads the live token via the lazy resolver", () => {
    const client = useHttp();
    const requestHandlers = (
      client.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (config: AxiosRequestConfig) => AxiosRequestConfig;
        } | null>;
      }
    ).handlers.filter(Boolean) as Array<{
      fulfilled: (config: AxiosRequestConfig) => AxiosRequestConfig;
    }>;
    const authInterceptor = requestHandlers[0]!.fulfilled;

    sessionStoreStub.getAccessToken.mockReturnValueOnce("rotated-token");
    const config = authInterceptor({ headers: {} });

    expect((config.headers as Record<string, string>).Authorization).toBe(
      "Bearer rotated-token",
    );
  });

  it("runs the refresh exactly ONCE for concurrent 401s across shared callers", async () => {
    // Single-flight regression: two callers fetch the SAME shared client. Two
    // concurrent requests both get 401 → the shared refresh closure (now bound
    // to one Axios instance for all 37 feature factories) must fire only once.
    const client = useHttp();

    let refreshCalls = 0;
    let okResponses = 0;
    let resolveRefresh: (token: string) => void = vi.fn();
    const refreshGate = new Promise<string>((resolve) => {
      resolveRefresh = resolve;
    });

    // Stub the underlying refresh endpoint so both 401s funnel through the
    // shared single-flight closure registered by registerResponseInterceptors.
    // The gate keeps the first refresh pending until both 401s have arrived,
    // proving they collapse into a single in-flight refresh.
    vi.spyOn(axios, "post").mockImplementation(async () => {
      refreshCalls += 1;
      const token = await refreshGate;
      sessionStoreStub.getAccessToken.mockReturnValue(token);
      return { data: { success: true, data: { token } } };
    });

    // Replace the transport adapter: first hit per request → 401 (no _retry),
    // retried request (carries Authorization from the refreshed token) → 200.
    client.defaults.adapter = (async (config: AxiosRequestConfig): Promise<unknown> => {
      const headers = (config.headers ?? {}) as Record<string, unknown>;
      const isRetry = typeof headers.Authorization === "string"
        && headers.Authorization === "Bearer rotated-token";
      if (isRetry) {
        okResponses += 1;
        return { status: 200, statusText: "OK", data: { ok: true }, headers: {}, config };
      }
      return Promise.reject(
        Object.assign(new Error("Unauthorized"), {
          isAxiosError: true,
          config,
          response: { status: 401, statusText: "Unauthorized", data: {}, headers: {}, config },
        }),
      );
    }) as unknown as typeof client.defaults.adapter;

    const reqA = client.get("/a");
    const reqB = client.get("/b");

    // Let both 401s reach the shared refresh before releasing the gate.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    resolveRefresh("rotated-token");

    await Promise.all([reqA, reqB]);

    expect(refreshCalls).toBe(1);
    expect(okResponses).toBe(2);
  });
});
