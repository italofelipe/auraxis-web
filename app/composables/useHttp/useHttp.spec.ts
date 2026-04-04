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

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("signs out and returns null when no refresh token exists", async () => {
    const sessionStore = {
      getRefreshToken: vi.fn().mockReturnValue(null),
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    const result = await refreshAccessToken("http://api", sessionStore);

    expect(result).toBeNull();
    expect(sessionStore.signOut).toHaveBeenCalledOnce();
  });

  it("calls updateTokens and returns new token on successful refresh", async () => {
    const sessionStore = {
      getRefreshToken: vi.fn().mockReturnValue("refresh-token"),
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        success: true,
        data: { token: "new-access-token", refresh_token: "new-refresh-token" },
      },
    });

    const result = await refreshAccessToken("http://api", sessionStore);

    expect(result).toBe("new-access-token");
    expect(sessionStore.updateTokens).toHaveBeenCalledWith("new-access-token", "new-refresh-token");
    expect(sessionStore.signOut).not.toHaveBeenCalled();
  });

  it("signs out and returns null when refresh request fails", async () => {
    const sessionStore = {
      getRefreshToken: vi.fn().mockReturnValue("refresh-token"),
      signOut: vi.fn(),
      updateTokens: vi.fn(),
    } as unknown as Parameters<typeof refreshAccessToken>[1];

    vi.spyOn(axios, "post").mockRejectedValueOnce(new Error("Network error"));

    const result = await refreshAccessToken("http://api", sessionStore);

    expect(result).toBeNull();
    expect(sessionStore.signOut).toHaveBeenCalledOnce();
  });
});
