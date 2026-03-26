import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRestore = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { restore: typeof mockRestore; isAuthenticated: boolean } => ({
    restore: mockRestore,
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
  }),
}));

vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  defineNuxtRouteMiddleware: (fn: () => unknown): (() => unknown) => fn,
}));

describe("authenticated middleware", () => {
  beforeEach(() => {
    mockRestore.mockClear();
    mockIsAuthenticated.mockClear();
    mockNavigateTo.mockClear();
  });

  it("restores session from cookie when in-memory state is empty", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./authenticated");
    (middleware.default as () => unknown)();
    expect(mockRestore).toHaveBeenCalledOnce();
  });

  it("skips restore when session is already loaded in memory", async () => {
    // After a fresh login, signIn() already populated the Pinia state.
    // Calling restore() would overwrite it with the cookie value, which may
    // read as null when useCookie loses its Nuxt context in an async callback.
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./authenticated");
    (middleware.default as () => unknown)();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("redirects to /login when not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./authenticated");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
    expect(result).toBe("/login");
  });

  it("does not redirect when authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./authenticated");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
