import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRestore = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));
const mockConsumeRedirect = vi.hoisted(() => vi.fn((): string => "/dashboard"));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { restore: typeof mockRestore; isAuthenticated: boolean } => ({
    restore: mockRestore,
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
  }),
}));

vi.mock("~/composables/useAuthRedirectContext/useAuthRedirectContext", () => ({
  useAuthRedirectContext: (): { consumeRedirect: typeof mockConsumeRedirect } => ({
    consumeRedirect: mockConsumeRedirect,
  }),
}));

vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  defineNuxtRouteMiddleware: (fn: () => unknown): (() => unknown) => fn,
}));

describe("guest-only middleware", () => {
  beforeEach(() => {
    mockRestore.mockClear();
    mockIsAuthenticated.mockClear();
    mockNavigateTo.mockClear();
    mockConsumeRedirect.mockClear();
    mockConsumeRedirect.mockReturnValue("/dashboard");
  });

  it("restores session from cookie when in-memory state is empty", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./guest-only");
    (middleware.default as () => unknown)();
    expect(mockRestore).toHaveBeenCalledOnce();
  });

  it("skips restore when session is already loaded in memory", async () => {
    // After a fresh login, signIn() already populated the Pinia state.
    // Calling restore() would overwrite it with the cookie value, which may
    // read as null when useCookie loses its Nuxt context in an async callback.
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./guest-only");
    (middleware.default as () => unknown)();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard when already authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./guest-only");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).toHaveBeenCalledWith("/dashboard");
    expect(result).toBe("/dashboard");
  });

  it("honors a pending auth redirect instead of forcing /dashboard (#1171)", async () => {
    // Prod symptom: the admin middleware bounces an operator to /login after
    // saving "/admin" as the destination. When the session turns out to be
    // valid on the login page, guest-only must send the operator to the saved
    // destination — discarding it strands the operator on the dashboard and
    // leaves a stale redirect in sessionStorage.
    mockIsAuthenticated.mockReturnValue(true);
    mockConsumeRedirect.mockReturnValue("/admin");
    const middleware = await import("./guest-only");
    const result = (middleware.default as () => unknown)();
    expect(mockConsumeRedirect).toHaveBeenCalledOnce();
    expect(mockNavigateTo).toHaveBeenCalledWith("/admin");
    expect(result).toBe("/admin");
  });

  it("does not redirect when not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./guest-only");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
