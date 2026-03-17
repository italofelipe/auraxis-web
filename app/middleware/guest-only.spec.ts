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

describe("guest-only middleware", () => {
  beforeEach(() => {
    mockRestore.mockClear();
    mockIsAuthenticated.mockClear();
    mockNavigateTo.mockClear();
  });

  it("restaura sessão antes de checar autenticação", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./guest-only");
    (middleware.default as () => unknown)();
    expect(mockRestore).toHaveBeenCalledOnce();
  });

  it("redireciona para /dashboard quando já autenticado", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = await import("./guest-only");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).toHaveBeenCalledWith("/dashboard");
    expect(result).toBe("/dashboard");
  });

  it("não redireciona quando não autenticado", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const middleware = await import("./guest-only");
    const result = (middleware.default as () => unknown)();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
