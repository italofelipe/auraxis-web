import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRestore = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));
const mockSurface = vi.hoisted(() => vi.fn(() => "app" as "app" | "marketing"));

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
  useRuntimeConfig: (): { public: { siteSurface: "app" | "marketing" } } => ({
    public: { siteSurface: mockSurface() },
  }),
}));

describe("app-home-redirect middleware", () => {
  beforeEach(() => {
    mockRestore.mockClear();
    mockIsAuthenticated.mockClear();
    mockNavigateTo.mockClear();
    mockSurface.mockReturnValue("app");
  });

  it("does nothing on the marketing surface", async () => {
    mockSurface.mockReturnValue("marketing");
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./app-home-redirect");
    const result = (middleware.default as () => unknown)();
    expect(mockRestore).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("redirects authenticated app visitors to the dashboard", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./app-home-redirect");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).toHaveBeenCalledWith("/dashboard");
    expect(result).toBe("/dashboard");
  });

  it("restores session and keeps guest visitors on the app home", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./app-home-redirect");
    const result = (middleware.default as () => unknown)();
    expect(mockRestore).toHaveBeenCalledOnce();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
