import axios, { type AxiosRequestConfig } from "axios";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHttpClient, normalizeBaseUrl, refreshAccessToken } from "./useHttp";

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

    expect(responseHandlers.filter(Boolean)).toHaveLength(0);
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

    expect(responseHandlers.filter(Boolean)).toHaveLength(1);
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
