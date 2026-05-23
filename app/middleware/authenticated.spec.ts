import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRestore = vi.hoisted(() => vi.fn());
const mockRunSessionRestore = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));
const mockRefreshAccessToken = vi.hoisted(() => vi.fn());

vi.mock("~/stores/session", () => ({
  useSessionStore: (): {
    restore: typeof mockRestore;
    runSessionRestore: typeof mockRunSessionRestore;
    isAuthenticated: boolean;
  } => ({
    restore: mockRestore,
    runSessionRestore: mockRunSessionRestore,
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
  }),
}));

vi.mock("~/composables/useHttp/useHttp", () => ({
  refreshAccessToken: mockRefreshAccessToken,
}));

vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  defineNuxtRouteMiddleware: (fn: () => unknown): (() => unknown) => {
    return fn;
  },
  useRuntimeConfig: (): { public: { apiBase: string } } => ({
    public: { apiBase: "https://api.example.test" },
  }),
}));

describe("authenticated middleware", () => {
  beforeEach(() => {
    mockRestore.mockClear();
    mockRunSessionRestore.mockReset();
    mockIsAuthenticated.mockClear();
    mockNavigateTo.mockClear();
    mockRefreshAccessToken.mockClear();
  });

  it("restores session through /auth/refresh when in-memory state is empty", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockRunSessionRestore.mockResolvedValue(true);
    const middleware = await import("./authenticated");
    await (middleware.default as () => Promise<unknown>)();

    expect(mockRestore).toHaveBeenCalledOnce();
    expect(mockRunSessionRestore).toHaveBeenCalledOnce();
    expect(mockRunSessionRestore.mock.calls[0]?.[0]).toBe("https://api.example.test");
  });

  it("skips restore when session is already loaded in memory", async () => {
    // After a fresh login, signIn() already populated the Pinia state.
    // Calling restore() would overwrite it with the cookie value, which may
    // read as null when useCookie loses its Nuxt context in an async callback.
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./authenticated");
    (middleware.default as () => unknown)();
    expect(mockRestore).not.toHaveBeenCalled();
    expect(mockRunSessionRestore).not.toHaveBeenCalled();
  });

  it("redirects to /login when not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockRunSessionRestore.mockResolvedValue(false);
    const middleware = await import("./authenticated");
    const result = await (middleware.default as () => Promise<unknown>)();
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
    expect(result).toBe("/login");
  });

  it("does not redirect when refresh restores the session after a hard reload", async () => {
    mockIsAuthenticated.mockReturnValueOnce(false).mockReturnValue(true);
    mockRunSessionRestore.mockResolvedValue(true);

    const middleware = await import("./authenticated");
    const result = await (middleware.default as () => Promise<unknown>)();

    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("does not redirect when authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./authenticated");
    const result = await (middleware.default as () => Promise<unknown>)();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
