import axios, { type AxiosRequestConfig } from "axios";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CSRF_HEADER_NAME,
  CSRF_REFRESH_COOKIE_NAME,
  createHttpClient,
  normalizeBaseUrl,
  readCookieValue,
  refreshAccessToken,
} from "./useHttp";

const useSessionStoreMock = vi.hoisted(() => vi.fn());

vi.mock("~/stores/session", () => ({
  useSessionStore: useSessionStoreMock,
}));

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
